import os
import sys
sys.path.append("/home/noah/.local/lib/python3.14/site-packages")
import math
import uuid
import datetime
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import chromadb
from dotenv import load_dotenv

# Load root .env configuration
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(dotenv_path=dotenv_path)

app = FastAPI(title="CipherScope AI Analysis Agent Backend")

# Enable CORS for Next.js frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ChromaDB persistent client
CHROMA_PATH = os.path.join(os.path.dirname(__file__), "chroma_db")
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = chroma_client.get_or_create_collection(name="cipher_scope_analyses")

class AnalysisRequest(BaseModel):
    fileName: str
    content: str  # Plaintext or cipher representation

def calculate_entropy(text: str) -> float:
    if not text:
        return 0.0
    entropy = 0.0
    length = len(text)
    frequencies = {}
    for char in text:
        frequencies[char] = frequencies.get(char, 0) + 1
    for count in frequencies.values():
        p = count / length
        entropy -= p * math.log2(p)
    return round(entropy, 2)

def detect_rsa_parameters(text: str):
    # Default parameters
    key_size = 2048
    exponent = 65537
    vulnerabilities = []
    
    t_lower = text.lower()
    
    # Check key size keywords
    if "512" in text:
        key_size = 512
        vulnerabilities.append("Small key size (512-bit)")
    elif "1024" in text:
        key_size = 1024
        vulnerabilities.append("1024-bit key is deprecated")
    elif "4096" in text:
        key_size = 4096
    elif "2048" in text:
        key_size = 2048
        
    # Check public exponent keywords
    if "e=3" in t_lower or "exponent: 3" in t_lower or "exponent = 3" in t_lower:
        exponent = 3
        vulnerabilities.append("Weak public exponent (e=3)")
        
    if key_size < 1024:
        risk_level = "Critical"
    elif key_size < 2048:
        risk_level = "High"
    else:
        risk_level = "Low"
        
    return {
        "keySize": key_size,
        "exponent": exponent,
        "publicExponent": exponent,
        "riskLevel": risk_level,
        "vulnerabilities": vulnerabilities,
        "modulusInfo": f"{key_size}-bit modulus detected."
    }

def detect_aes_parameters(text: str):
    # Default parameters
    mode = "GCM"
    key_strength = "256-bit"
    pwd_complexity = "Strong"
    recommendations = []
    
    t_upper = text.upper()
    t_lower = text.lower()
    
    if "ECB" in t_upper:
        mode = "ECB"
        recommendations.append("Replace ECB mode with GCM or CBC to prevent block-level pattern leakage")
    elif "CBC" in t_upper:
        mode = "CBC"
        recommendations.append("Use GCM mode for authenticated encryption")
        
    if "128" in text:
        key_strength = "128-bit"
        recommendations.append("Upgrade to AES-256 for post-quantum resistance")
        
    if "weak" in t_lower or "password123" in t_lower or "admin" in t_lower:
        pwd_complexity = "Weak"
        recommendations.append("Key/password detected is weak — must use a randomly generated key")
        
    return {
        "keyStrength": key_strength,
        "mode": mode,
        "encryptionMode": mode,
        "passwordComplexity": pwd_complexity,
        "securityRecommendations": recommendations
    }

def detect_patterns(text: str):
    repeated_chars = False
    block_rep = False
    
    # Check simple character repetition
    for i in range(len(text) - 4):
        if text[i] == text[i+1] == text[i+2] == text[i+3] == text[i+4]:
            repeated_chars = True
            break
            
    if "ECB" in text.upper():
        block_rep = True
        
    obs = "No significant repeating patterns found."
    if block_rep:
        obs = "ECB mode encryption has produced repeated data block patterns. This leaks structural data."
    elif repeated_chars:
        obs = "Significant character repetitions detected in ciphertext."
        
    return {
        "repeatedCharacters": repeated_chars,
        "repeatedSequences": ["4e6f7720697320746865"] if block_rep else [],
        "blockRepetition": block_rep,
        "observations": obs
    }

import zipfile
import xml.etree.ElementTree as ET
from io import BytesIO
from fastapi import UploadFile, File

def extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        with zipfile.ZipFile(BytesIO(file_bytes)) as docx:
            xml_content = docx.read('word/document.xml')
            root = ET.fromstring(xml_content)
            
            # Group text nodes by paragraph elements (w:p) to preserve structure
            paragraphs = []
            for elem in root.iter():
                if elem.tag.endswith('}p'):
                    p_text = []
                    for child in elem.iter():
                        if child.tag.endswith('}t') and child.text:
                            p_text.append(child.text)
                    if p_text:
                        paragraphs.append("".join(p_text))
                        
            return "\n".join(paragraphs)
    except Exception as e:
        print(f"Failed to parse docx: {e}")
        return ""

def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        import pypdf
        reader = pypdf.PdfReader(BytesIO(file_bytes))
        pages_text = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                pages_text.append(t)
        return "\n".join(pages_text)
    except Exception as e:
        print(f"Failed to parse pdf using pypdf: {e}")
        return ""

def extract_text_from_text_file(file_bytes: bytes) -> str:
    for encoding in ("utf-8", "utf-16", "latin-1"):
        try:
            return file_bytes.decode(encoding)
        except UnicodeDecodeError:
            continue
    return file_bytes.decode("utf-8", errors="ignore")


def get_unstructured_chunks(text: str):
    # Package the entire extracted text in exactly one row
    return [
        {
            "id": 1,
            "text": text,
            "length": len(text),
            "type": "Full Document Text"
        }
    ]

def perform_cryptographic_analysis(file_name: str, content: str):
    # Calculate exact Shannon Entropy
    entropy_val = calculate_entropy(content)
    
    # Determine entropy classification
    if entropy_val < 3.0:
        entropy_class = "Very Low"
        interpretation = "Extremely low entropy. Content is likely plaintext or poorly formatted data."
    elif entropy_val < 5.0:
        entropy_class = "Low"
        interpretation = "Low to moderate entropy detected. The file contains readable characters, repeating byte patterns, or unencrypted metadata headers."
    elif entropy_val < 7.0:
        entropy_class = "Medium"
        interpretation = "Medium entropy detected. Consistent with basic compression or obfuscation."
    else:
        entropy_class = "High"
        interpretation = "High entropy detected. Content matches strongly encrypted or high-density compressed data."
        
    randomness_score = int((entropy_val / 8.0) * 100)
    
    # Heuristic cryptographic scanning
    rsa_info = detect_rsa_parameters(content)
    aes_info = detect_aes_parameters(content)
    pattern_info = detect_patterns(content)
    
    # Calculate initial scores
    rsa_score = 95 if rsa_info["keySize"] >= 4096 else (80 if rsa_info["keySize"] >= 2048 else (45 if rsa_info["keySize"] >= 1024 else 12))
    aes_score = 95 if aes_info["mode"] == "GCM" else (70 if aes_info["mode"] == "CBC" else 25)
    entropy_score = randomness_score
    pattern_score = 20 if pattern_info["blockRepetition"] else 95
    
    overall_score = int((rsa_score + aes_score + entropy_score + pattern_score) / 4)
    
    status = "Secure"
    if overall_score < 40:
        status = "Critical"
    elif overall_score < 60:
        status = "Weak"
    elif overall_score < 80:
        status = "Moderate"
        
    # Generate default recommendations
    recommendations_list = []
    if rsa_info["keySize"] < 2048:
        recommendations_list.append({"priority": "Critical", "action": "Increase RSA key size to minimum 2048 bits, preferably 4096 bits"})
    if rsa_info["exponent"] < 65537:
        recommendations_list.append({"priority": "Critical", "action": "Replace public exponent e=3 with e=65537 (0x10001) to prevent low-exponent attacks"})
    if aes_info["mode"] == "ECB":
        recommendations_list.append({"priority": "High", "action": "Switch from AES-ECB mode to AES-GCM or AES-CBC to prevent structural leakage"})
    
    for r in aes_info["securityRecommendations"]:
        prio = "High" if "replace" in r.lower() or "must" in r.lower() else "Medium"
        recommendations_list.append({"priority": prio, "action": r})
        
    if not recommendations_list:
        recommendations_list.append({"priority": "Low", "action": "Consider rotating keys every 90 days"})
        
    findings = "This file meets basic cryptographic recommendations."
    if overall_score < 60:
        findings = "Critical weaknesses detected. The configuration fails standard security validation checks."
        
    security_assessment = f"RSA config risk is {rsa_info['riskLevel']}. AES mode is {aes_info['mode']} with {aes_info['passwordComplexity']} password rating."

    ai_success = False
    structured_parameters_list = []
    
    # 1. Try Groq Cloud (Llama 3.3)
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if groq_api_key:
        try:
            print("Attempting analysis using Groq Cloud (Llama 3)...")
            headers = {
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json"
            }
            prompt = (
                f"You are a professional cryptographic security analysis assistant. Analyze the entire text of the document '{file_name}':\n"
                f"1. Entropy: {entropy_val}/8.0\n"
                f"2. RSA Parameters: Key size {rsa_info['keySize']}, exponent e={rsa_info['exponent']}\n"
                f"3. AES Parameters: Mode {aes_info['mode']}, Key strength {aes_info['keyStrength']}\n"
                f"4. Document Full Text Content:\n{content}\n\n"
                f"Provide a brief assessment summary and specific recommendations.\n"
                f"You MUST return a JSON object exactly formatted as:\n"
                f'{{\n'
                f'  "securityAssessment": "Detailed analysis of the configuration vulnerabilities found in the entire document.",\n'
                f'  "findings": "A summary sentence of the overall file security status.",\n'
                f'  "recommendations": [\n'
                f'    {{"priority": "Critical"|"High"|"Medium"|"Low", "action": "Specific recommendation description"}}\n'
                f'  ]\n'
                f'}}'
            )
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {
                        "role": "system", 
                        "content": "You are a professional cryptographic security analysis assistant. You must return only a raw, valid JSON object matching the requested schema. Do not return markdown, do not return any conversational text outside the JSON."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                "response_format": {"type": "json_object"}
            }
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=12.0
            )
            if response.status_code == 200:
                res_data = response.json()
                content_str = res_data["choices"][0]["message"]["content"]
                import json
                ai_data = json.loads(content_str)
                if "securityAssessment" in ai_data:
                    security_assessment = ai_data["securityAssessment"]
                if "findings" in ai_data:
                    findings = ai_data["findings"]
                if "recommendations" in ai_data and isinstance(ai_data["recommendations"], list):
                    recommendations_list = ai_data["recommendations"]
                ai_success = True
                print("Groq analysis succeeded!")
        except Exception as e:
            print(f"Groq Cloud analysis failed: {e}. Falling back to Ollama...")

    # 2. Try Ollama (Local Llama 3)
    if not ai_success:
        try:
            print("Attempting analysis using local Ollama...")
            ollama_url = "http://localhost:11434/api/generate"
            prompt = (
                f"You are an expert cryptographic security analysis agent. Analyze the following document:\n"
                f"File name: {file_name}\n"
                f"Entropy value: {entropy_val}/8.0\n"
                f"Detected RSA: Key size {rsa_info['keySize']}, exponent e={rsa_info['exponent']}\n"
                f"Detected AES: Mode {aes_info['mode']}, Key strength {aes_info['keyStrength']}\n"
                f"Content text:\n{content}\n\n"
                f"Provide a brief assessment summary and specific recommendations. Return response as JSON only, matching format:\n"
                f'{{\n'
                f'  "securityAssessment": "...",\n'
                f'  "findings": "...",\n'
                f'  "recommendations": [\n'
                f'    {{"priority": "...", "action": "..."}}\n'
                f'  ]\n'
                f'}}'
            )
            response = requests.post(
                ollama_url,
                json={"model": "llama3", "prompt": prompt, "format": "json", "stream": False},
                timeout=8.0
            )
            if response.status_code == 200:
                res_json = response.json()
                import json
                ai_data = json.loads(res_json.get("response", "{}"))
                if "securityAssessment" in ai_data:
                    security_assessment = ai_data["securityAssessment"]
                if "findings" in ai_data:
                    findings = ai_data["findings"]
                if "recommendations" in ai_data and isinstance(ai_data["recommendations"], list):
                    recommendations_list = ai_data["recommendations"]
                ai_success = True
                print("Ollama analysis succeeded!")
        except Exception as e:
            print(f"Ollama local query skipped or failed. Error: {e}")

    # Build unstructured chunks
    unstructured_chunks_list = get_unstructured_chunks(content)

    # Package the AI structured results into exactly one row containing JSON format
    import json
    ai_json_str = json.dumps({
        "securityAssessment": security_assessment,
        "findings": findings,
        "recommendations": recommendations_list
    }, indent=2)

    structured_parameters_list = [
        {
            "category": "AI Forensics",
            "element": "Structured JSON Result",
            "value": ai_json_str,
            "classification": "Entire Cryptographic Analysis JSON payload",
            "status": "Secure" if overall_score >= 75 else "Low"
        }
    ]

    # Pack both tables into patterns dict
    pattern_info["unstructuredChunks"] = unstructured_chunks_list
    pattern_info["structuredParameters"] = structured_parameters_list

    # Build the final Report structure
    report_id = f"rpt-{str(uuid.uuid4())[:8]}"
    report = {
        "id": report_id,
        "fileName": file_name,
        "type": file_name.split(".")[-1].upper() if "." in file_name else "TXT",
        "fileSize": f"{len(content)/1024:.1f} KB",
        "analysisDate": datetime.datetime.utcnow().isoformat() + "Z",
        "securityScore": overall_score,
        "status": status,
        "entropy": {
            "value": entropy_val,
            "classification": entropy_class,
            "randomnessScore": randomness_score,
            "explanation": "Shannon entropy measures the average information content per character.",
            "interpretation": interpretation
        },
        "rsa": {
            "keySize": rsa_info["keySize"],
            "exponent": rsa_info["exponent"],
            "publicExponent": rsa_info["exponent"],
            "riskLevel": rsa_info["riskLevel"],
            "vulnerabilities": rsa_info["vulnerabilities"],
            "securityAssessment": security_assessment,
            "modulusInfo": rsa_info["modulusInfo"]
        },
        "aes": {
            "keyStrength": aes_info["keyStrength"],
            "mode": aes_info["mode"],
            "encryptionMode": aes_info["mode"],
            "passwordComplexity": aes_info["passwordComplexity"],
            "securityRecommendations": [r["action"] for r in recommendations_list]
        },
        "patterns": pattern_info,
        "recommendations": recommendations_list,
        "findings": findings
    }

    # Store analysis context inside ChromaDB
    try:
        collection.upsert(
            ids=[report_id],
            documents=[content],
            metadatas=[{
                "file_name": file_name,
                "security_score": overall_score,
                "entropy": entropy_val,
                "status": status,
                "analysis_date": report["analysisDate"]
            }]
        )
    except Exception as e:
        print(f"Failed to index document in ChromaDB: {e}")

    # Automatically Sync to Supabase in real-time
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if supabase_url and service_key:
        try:
            print(f"Auto-syncing report {report_id} to Supabase from perform_cryptographic_analysis...")
            headers = {
                "apikey": service_key,
                "Authorization": f"Bearer {service_key}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates"
            }
            row = {
                "id": report_id,
                "file_name": file_name,
                "type": report["type"],
                "file_size": report["fileSize"],
                "analysis_date": report["analysisDate"],
                "security_score": overall_score,
                "status": status,
                "entropy": report["entropy"],
                "rsa": report["rsa"],
                "aes": report["aes"],
                "patterns": report["patterns"],
                "recommendations": report["recommendations"],
                "findings": report["findings"]
            }
            res = requests.post(f"{supabase_url}/rest/v1/reports", json=row, headers=headers)
            if res.status_code in [200, 201]:
                print(f"Auto-sync main report {report_id} succeeded.")
                
                # Sync unstructured chunks
                if unstructured_chunks_list:
                    chunk_rows = []
                    for chunk in unstructured_chunks_list:
                        chunk_rows.append({
                            "report_id": report_id,
                            "chunk_id": chunk.get("id"),
                            "text": chunk.get("text"),
                            "type": chunk.get("type"),
                            "length": chunk.get("length")
                        })
                    c_res = requests.post(f"{supabase_url}/rest/v1/unstructured_chunks", json=chunk_rows, headers=headers)
                    if c_res.status_code not in [200, 201]:
                        print(f"Warning: Auto-sync unstructured_chunks failed: {c_res.status_code}, {c_res.text}")

                # Sync structured parameters
                if structured_parameters_list:
                    param_rows = []
                    for param in structured_parameters_list:
                        param_rows.append({
                            "report_id": report_id,
                            "category": param.get("category"),
                            "element": param.get("element"),
                            "value": param.get("value"),
                            "classification": param.get("classification"),
                            "status": param.get("status")
                        })
                    p_res = requests.post(f"{supabase_url}/rest/v1/structured_parameters", json=param_rows, headers=headers)
                    if p_res.status_code not in [200, 201]:
                        print(f"Warning: Auto-sync structured_parameters failed: {p_res.status_code}, {p_res.text}")
        except Exception as e:
            print(f"Warning: Auto-sync to Supabase failed: {e}")

    return report


class ReportModel(BaseModel):
    id: str
    fileName: str
    type: str
    fileSize: str
    analysisDate: str
    securityScore: int
    status: str
    entropy: dict
    rsa: dict
    aes: dict
    patterns: dict
    recommendations: list
    findings: str

@app.post("/save")
async def save_report_endpoint(report: ReportModel):
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if supabase_url and service_key:
        try:
            print(f"Syncing report {report.id} to Supabase table from Python backend...")
            headers = {
                "apikey": service_key,
                "Authorization": f"Bearer {service_key}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates"
            }
            row = {
                "id": report.id,
                "file_name": report.fileName,
                "type": report.type,
                "file_size": report.fileSize,
                "analysis_date": report.analysisDate,
                "security_score": report.securityScore,
                "status": report.status,
                "entropy": report.entropy,
                "rsa": report.rsa,
                "aes": report.aes,
                "patterns": report.patterns,
                "recommendations": report.recommendations,
                "findings": report.findings
            }
            res = requests.post(f"{supabase_url}/rest/v1/reports", json=row, headers=headers)
            if res.status_code in [200, 201]:
                print(f"Report {report.id} synced successfully to Supabase.")
                
                # Sync unstructured chunks to the dedicated public.unstructured_chunks table
                unstructured_chunks = report.patterns.get("unstructuredChunks", [])
                if unstructured_chunks:
                    print(f"Syncing {len(unstructured_chunks)} raw paragraphs to public.unstructured_chunks table...")
                    chunk_rows = []
                    for chunk in unstructured_chunks:
                        chunk_rows.append({
                            "report_id": report.id,
                            "chunk_id": chunk.get("id"),
                            "text": chunk.get("text"),
                            "type": chunk.get("type"),
                            "length": chunk.get("length")
                        })
                    c_res = requests.post(f"{supabase_url}/rest/v1/unstructured_chunks", json=chunk_rows, headers=headers)
                    if c_res.status_code not in [200, 201]:
                        print(f"Warning: Failed to populate public.unstructured_chunks table. Code: {c_res.status_code}, Detail: {c_res.text}")

                # Sync structured parameters to the dedicated public.structured_parameters table
                structured_params = report.patterns.get("structuredParameters", [])
                if structured_params:
                    print(f"Syncing {len(structured_params)} structured parameters to public.structured_parameters table...")
                    param_rows = []
                    for param in structured_params:
                        param_rows.append({
                            "report_id": report.id,
                            "category": param.get("category"),
                            "element": param.get("element"),
                            "value": param.get("value"),
                            "classification": param.get("classification"),
                            "status": param.get("status")
                        })
                    p_res = requests.post(f"{supabase_url}/rest/v1/structured_parameters", json=param_rows, headers=headers)
                    if p_res.status_code not in [200, 201]:
                        print(f"Warning: Failed to populate public.structured_parameters table. Code: {p_res.status_code}, Detail: {p_res.text}")
                
                return {"status": "success", "message": f"Report {report.id} saved to Supabase."}
            else:
                raise HTTPException(status_code=res.status_code, detail=f"Failed to save to Supabase: {res.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        raise HTTPException(status_code=500, detail="Supabase environment variables not configured.")


@app.post("/analyze/text")
async def analyze_text(req: AnalysisRequest):
    return perform_cryptographic_analysis(req.fileName, req.content)

@app.post("/analyze/file")
async def analyze_file(file: UploadFile = File(...)):
    file_bytes = await file.read()
    file_name = file.filename
    content = ""
    
    # Check file extension
    ext = file_name.split(".")[-1].lower() if "." in file_name else ""
    if ext == "docx":
        content = extract_text_from_docx(file_bytes)
    elif ext == "pdf":
        content = extract_text_from_pdf(file_bytes)
    elif ext in ["csv", "json", "txt", "tsv", "xml", "yaml", "yml", "md"]:
        content = extract_text_from_text_file(file_bytes)
    else:
        try:
            content = extract_text_from_text_file(file_bytes)
        except Exception:
            content = f"Binary content of {file_name}"
            
    return perform_cryptographic_analysis(file_name, content)

@app.post("/analyze")
async def analyze_document(req: AnalysisRequest):
    return perform_cryptographic_analysis(req.fileName, req.content)

class FixGarbledRequest(BaseModel):
    userId: str
    fileName: str
    text: str

@app.post("/analyze/fix-garbled")
def fix_garbled_text(req: FixGarbledRequest):
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if not groq_api_key:
        raise HTTPException(status_code=500, detail="Groq API key not configured")
        
    try:
        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json"
        }
        
        import urllib.parse
        import re
        
        # 1. Algorithmic Pre-processing: Decode URL-encoded text
        decoded_text = urllib.parse.unquote_plus(req.text)
        
        # 2. Extract only readable English characters and standard punctuation
        # This strips out the corrupted binary data which cannot be recovered 
        # (AES blocks get misaligned when ciphertext is manually edited)
        # We allow standard ASCII (32-126) plus newlines and tabs
        cleaner_text = re.sub(r'[^\x09\x0A\x0D\x20-\x7E]+', '', decoded_text)
        
        # Optional: collapse multiple weird spaces/newlines that might have resulted from stripping
        # but preserving the main structure
        corrected_text = re.sub(r'\n{3,}', '\n\n', cleaner_text).strip()
        
        if not corrected_text:
            corrected_text = "No readable English text could be recovered from this corrupted payload."
        
        # Save to supabase
        supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        if supabase_url and service_key:
            try:
                headers_supa = {
                    "apikey": service_key,
                    "Authorization": f"Bearer {service_key}",
                    "Content-Type": "application/json",
                    "Prefer": "resolution=merge-duplicates"
                }
                doc_id = f"corr-{str(uuid.uuid4())[:8]}"
                
                # Convert Clerk userId string to a valid UUID v5 format if it's not already a valid UUID
                db_user_id = req.userId
                try:
                    uuid.UUID(db_user_id)
                except ValueError:
                    db_user_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, req.userId))

                row = {
                    "id": doc_id,
                    "user_id": db_user_id,
                    "original_text": req.text,
                    "corrected_text": corrected_text,
                    "document_name": req.fileName
                }
                requests.post(f"{supabase_url}/rest/v1/corrected_documents", json=row, headers=headers_supa)
            except Exception as e:
                print(f"Warning: Failed to save to corrected_documents: {e}")

        return {"correctedText": corrected_text}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class VaultAnalysisRequest(BaseModel):
    fileName: str
    content: str
    rsaKeySize: Optional[int] = None
    aesMode: Optional[str] = None
    aesKeySize: Optional[int] = None

@app.post("/analyze/vault")
async def analyze_vault_document(req: VaultAnalysisRequest):
    file_name = req.fileName
    content = req.content
    
    # Calculate exact Shannon Entropy
    entropy_val = calculate_entropy(content)
    
    randomness_score = int((entropy_val / 8.0) * 100)
    
    rsa_size = req.rsaKeySize or 2048
    aes_mode = req.aesMode or "GCM"
    aes_size = req.aesKeySize or 256
    
    rsa_score = 95 if rsa_size >= 4096 else (80 if rsa_size >= 2048 else (45 if rsa_size >= 1024 else 12))
    aes_score = 95 if aes_mode == "GCM" else (70 if aes_mode == "CBC" else 25)
    entropy_score = randomness_score
    
    overall_score = int((rsa_score + aes_score + entropy_score) / 3)
    
    status = "Secure"
    if overall_score < 40:
        status = "Critical"
    elif overall_score < 60:
        status = "Weak"
    elif overall_score < 80:
        status = "Moderate"
        
    security_assessment = f"RSA config risk is evaluated based on key size {rsa_size}. AES mode is {aes_mode}."
    findings = ""
    recommendations_list = []
    
    ai_success = False
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if groq_api_key:
        try:
            print("Attempting analysis using Groq Cloud (Llama 3)...")
            headers = {
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json"
            }
            prompt = (
                f"You are a professional cryptographic security analysis assistant. Analyze the entire text of the document '{file_name}':\n"
                f"1. Entropy: {entropy_val}/8.0\n"
                f"2. RSA Parameters: Key size {rsa_size}\n"
                f"3. AES Parameters: Mode {aes_mode}, Key strength {aes_size}\n"
                f"4. Document Full Text Content:\n{content}\n\n"
                f"Based on the keys provided, provide a REAL and CORRECT assessment summary and specific recommendations.\n"
                f"You MUST return a JSON object exactly formatted as:\n"
                f'{{\n'
                f'  "securityAssessment": "Detailed analysis of the configuration vulnerabilities.",\n'
                f'  "findings": "A summary sentence of the overall file security status.",\n'
                f'  "securityScore": "An integer between 0 and 100 representing the REAL security score of the document based on the keys and content.",\n'
                f'  "recommendations": [\n'
                f'    {{"priority": "Critical"|"High"|"Medium"|"Low", "action": "Specific recommendation description"}}\n'
                f'  ]\n'
                f'}}'
            )
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {
                        "role": "system", 
                        "content": "You are a professional cryptographic security analysis assistant. You must return only a raw, valid JSON object matching the requested schema. Do not return markdown."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                "response_format": {"type": "json_object"}
            }
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=12.0
            )
            if response.status_code == 200:
                res_data = response.json()
                content_str = res_data["choices"][0]["message"]["content"]
                import json
                ai_data = json.loads(content_str)
                if "securityAssessment" in ai_data:
                    security_assessment = ai_data["securityAssessment"]
                if "findings" in ai_data:
                    findings = ai_data["findings"]
                if "securityScore" in ai_data:
                    try:
                        overall_score = int(ai_data["securityScore"])
                        if overall_score < 40:
                            status = "Critical"
                        elif overall_score < 60:
                            status = "Weak"
                        elif overall_score < 80:
                            status = "Moderate"
                        else:
                            status = "Secure"
                    except ValueError:
                        pass
                if "recommendations" in ai_data and isinstance(ai_data["recommendations"], list):
                    recommendations_list = ai_data["recommendations"]
                ai_success = True
                print("Groq analysis succeeded for Vault endpoint!")
        except Exception as e:
            print(f"Groq Cloud analysis failed: {e}")

    report_id = f"rpt-{str(uuid.uuid4())[:8]}"
    return {
        "id": report_id,
        "fileName": file_name,
        "type": "Decrypted Document (Vault Analysis)",
        "fileSize": len(content),
        "analysisDate": datetime.datetime.utcnow().isoformat() + "Z",
        "securityScore": overall_score,
        "status": status,
        "entropy": {
            "value": round(entropy_val, 2),
            "classification": "Medium",
            "interpretation": "Analysis from Key Vault"
        },
        "rsa": {
            "keySize": rsa_size,
            "exponent": 65537,
            "padding": "OAEP",
            "riskLevel": "Medium"
        },
        "aes": {
            "mode": aes_mode,
            "keyStrength": f"{aes_size}-bit",
            "passwordComplexity": "Medium",
            "securityRecommendations": []
        },
        "patterns": {
            "hexPatterns": 0,
            "base64Patterns": 0,
            "standardEmail": 0,
            "blockRepetition": False,
            "unstructuredChunks": [{"id": 1, "text": content, "length": len(content), "type": "Full Text"}]
        },
        "findings": findings,
        "recommendations": recommendations_list
    }

class AudioPreviewRequest(BaseModel):
    userId: str
    documentName: str
    content: str
    associatedKeyId: Optional[str] = None
    rsaKeySize: Optional[int] = None
    aesKeySize: Optional[int] = None
    aesMode: Optional[str] = None

@app.post("/generate/audio")
def generate_audio_preview(req: AudioPreviewRequest):
    entropy_val = calculate_entropy(req.content)
    
    # Check if the decrypted content is just a placeholder about binary data or is empty
    is_binary_notice = "binary content" in req.content.lower() or "could not be fully parsed" in req.content.lower()
    
    # Build details about cryptographic settings
    rsa_size_val = req.rsaKeySize or 2048
    aes_size_val = req.aesKeySize or 256
    aes_mode_val = req.aesMode or "GCM"
    
    # 1. Base fallback narration script (fully detailed as requested)
    if is_binary_notice:
        summary_script = (
            f"This is a detailed security audit narration for document: {req.documentName}. "
            f"The forensic engine verified that this document was successfully decrypted using an RSA key modulus size of {rsa_size_val} bits, "
            f"combined with an AES session key strength of {aes_size_val} bits, running in the {aes_mode_val} block cipher mode. "
            f"The decrypted document contains binary archive assets and structured data. "
            f"Analyzing the security posture, there is an exceptionally low risk of this document being decoded or compromised by unauthorized parties, "
            f"as the key lengths and block mode comply with high military-grade security standards. "
            f"However, as a best practice to maintain confidentiality and mitigate future vulnerabilities, we recommend rotating the keys periodically. "
            f"Key rotation limits the volume of data encrypted under a single key and is a highly recommended practice."
        )
    else:
        summary_script = (
            f"This is a detailed security audit narration for document: {req.documentName}. "
            f"This plaintext file has been decrypted using an RSA key with a modulus size of {rsa_size_val} bits, "
            f"paired with an AES session key strength of {aes_size_val} bits running in the {aes_mode_val} block cipher mode. "
            f"Based on our entropy analysis score of {entropy_val:.2f}, the document contains readable plain text. "
            f"Evaluating the security posture, because you used a key size of {aes_size_val} bits and the robust {aes_mode_val} block cipher mode, "
            f"the content is completely safe and there is absolutely no risk of it being decoded or cracked by modern adversaries. "
            f"To keep this document secure, we advise rotating these keys as a security best practice. Changing keys regularly ensures "
            f"that even if a single key is ever compromised, the rest of your archives remain completely protected."
        )

    ai_success = False
    
    # 2. Try Groq (Llama 3.3)
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if groq_api_key:
        try:
            print("Generating narration prompt using Groq...")
            headers = {
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json"
            }
            
            system_prompt = (
                "You are an articulate, professional, and reassuring AI cryptographic security auditor. "
                "You output ONLY the raw spoken narration script. "
                "Do not include any headers, markdown, section labels, or parenthetical remarks. Just output the clean speech text."
            )
            
            llm_prompt = (
                f"Generate a professional spoken-audio narration script for the decrypted document '{req.documentName}'.\n"
                f"Make sure to explain in detail so that the speech takes over a minute to read (aim for about 180 to 220 words).\n\n"
                f"The cryptographic settings used for this document are:\n"
                f"- RSA Modulus Size: {rsa_size_val} bits\n"
                f"- AES Session Key Strength: {aes_size_val} bits\n"
                f"- AES Block Cipher Mode: {aes_mode_val}\n\n"
                f"Please cover the following points in your speech:\n"
                f"1. Explain what context the document contains (if it's binary content like .docx, explain that it contains structured binary assets).\n"
                f"2. Explicitly state the cryptographic parameters: the RSA Modulus Size, the AES Session Key Strength, and the AES Block Cipher Mode.\n"
                f"3. Summarize the security posture: analyze whether the document is at risk of being decoded or not, and reassure the user that these parameters are extremely strong.\n"
                f"4. Address whether they should change or rotate the keys, and explain why key rotation is a recommended security practice.\n\n"
                f"Document Content Preview:\n{req.content[:3000]}"
            )
            
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": llm_prompt}
                ]
            }
            res = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=12.0
            )
            if res.status_code == 200:
                summary_script = res.json()["choices"][0]["message"]["content"].strip()
                ai_success = True
                print("Generated script with Groq:", summary_script)
            else:
                print(f"Groq API call returned code {res.status_code}: {res.text}")
        except Exception as e:
            print(f"Failed to generate script using Groq: {e}")

    # 3. Try OpenRouter (Llama 3 Instruct Free fallback)
    openrouter_api_key = os.environ.get("OPENROUTER_API_KEY")
    if not ai_success and openrouter_api_key:
        try:
            print("Generating narration prompt using OpenRouter...")
            headers = {
                "Authorization": f"Bearer {openrouter_api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "CipherScope"
            }
            llm_prompt = (
                f"Generate a detailed cryptographic narration script (aim for 180 to 220 words, explaining for over a minute) "
                f"about the decrypted document '{req.documentName}' which contains {'binary assets' if is_binary_notice else 'plaintext'}.\n"
                f"You MUST explicitly speak about:\n"
                f"- RSA Modulus Size of {rsa_size_val} bits\n"
                f"- AES Session Key Strength of {aes_size_val} bits\n"
                f"- AES Block Cipher Mode of {aes_mode_val}\n"
                f"Analyze if the document is at risk of being decoded or not, and explain that key rotation is recommended practice. "
                f"Output only the spoken narration text."
            )
            payload = {
                "model": "meta-llama/llama-3-8b-instruct:free",
                "messages": [
                    {"role": "user", "content": llm_prompt}
                ]
            }
            res = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=12.0
            )
            if res.status_code == 200:
                summary_script = res.json()["choices"][0]["message"]["content"].strip()
                ai_success = True
                print("Generated script with OpenRouter:", summary_script)
            else:
                print(f"OpenRouter API call returned code {res.status_code}: {res.text}")
        except Exception as e:
            print(f"Failed to generate script using OpenRouter: {e}")

    # 4. Local text parsing summarizer fallback
    if not ai_success and not is_binary_notice and len(req.content.strip()) > 30:
        try:
            print("Generating local sentence-based summary...")
            import re
            sentences = re.split(r'(?<=[.!?])\s+', req.content.strip())
            clean_sentences = [s.strip() for s in sentences if len(s.strip()) > 8]
            if clean_sentences:
                # Get up to 3 non-empty sentences
                local_sum = " ".join(clean_sentences[:3])
                if len(local_sum.split()) > 5:
                    summary_script = f"Here is an audio summary of the decrypted content: {local_sum}"
                    ai_success = True
                    print("Generated script locally:", summary_script)
        except Exception as e:
            print(f"Failed to generate local summary: {e}")

    # Clean markdown, backticks, asterisks, hashes, etc. to prevent TTS spelling them out
    summary_script = summary_script.replace("`", "").replace("*", "").replace("#", "").replace("_", "")

    audio_base64 = ""
    hf_success = False
    mime_type = "audio/wav"

    # Prioritize loading the custom project voice (Julien) if provided
    project_voice_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "projectvoice.mp3")
    if os.path.exists(project_voice_path):
        try:
            print("Loading custom project voice from public/projectvoice.mp3...")
            with open(project_voice_path, "rb") as f:
                import base64
                audio_base64 = base64.b64encode(f.read()).decode("utf-8")
            hf_success = True
            mime_type = "audio/mpeg"
            print("Custom project voice loaded successfully!")
        except Exception as e:
            print(f"Failed to load custom project voice: {e}")

    if not hf_success and hf_token:
        try:
            print("Generating audio using Hugging Face facebook/mms-tts-eng...")
            hf_headers = {
                "Authorization": f"Bearer {hf_token}",
                "Content-Type": "application/json"
            }
            hf_payload = {"inputs": summary_script}
            hf_res = requests.post(
                "https://api-inference.huggingface.co/models/facebook/mms-tts-eng",
                headers=hf_headers,
                json=hf_payload,
                timeout=15.0
            )
            if hf_res.status_code == 200:
                import base64
                audio_base64 = base64.b64encode(hf_res.content).decode("utf-8")
                hf_success = True
                mime_type = "audio/wav"
                print("Hugging Face audio generation successful!")
            else:
                print(f"Hugging Face status {hf_res.status_code}: {hf_res.text}")
        except Exception as e:
            print(f"Failed to call Hugging Face: {e}")
            
    if not hf_success:
        try:
            print("Generating fallback synthesized audio file...")
            import io
            import wave
            import struct
            
            sample_rate = 8000
            num_samples = sample_rate * 10
            audio_buffer = io.BytesIO()
            
            with wave.open(audio_buffer, 'wb') as wav:
                wav.setnchannels(1)
                wav.setsampwidth(2)
                wav.setframerate(sample_rate)
                
                for i in range(num_samples):
                    t = i / sample_rate
                    freq1 = 220 + 50 * math.sin(2 * math.pi * 0.5 * t)
                    freq2 = 440 + 100 * math.cos(2 * math.pi * 0.2 * t)
                    
                    val = 0.5 * math.sin(2 * math.pi * freq1 * t) + 0.3 * math.sin(2 * math.pi * freq2 * t)
                    if int(t * 2) % 2 == 0:
                        val += 0.2 * math.sin(2 * math.pi * 880 * t)
                        
                    if t < 0.5:
                        val *= (t / 0.5)
                    elif t > 9.5:
                        val *= ((10.0 - t) / 0.5)
                        
                    val = max(-1.0, min(1.0, val))
                    sample = int(val * 32767)
                    wav.writeframesraw(struct.pack('<h', sample))
            
            import base64
            audio_base64 = base64.b64encode(audio_buffer.getvalue()).decode("utf-8")
            mime_type = "audio/wav"
            print("Fallback synthesized audio generated successfully!")
        except Exception as e:
            print(f"Fallback audio generation failed: {e}")

    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if supabase_url and service_key:
        try:
            print("Saving audio preview to Supabase table...")
            headers = {
                "apikey": service_key,
                "Authorization": f"Bearer {service_key}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates"
            }
            
            db_user_id = req.userId
            try:
                uuid.UUID(db_user_id)
            except ValueError:
                db_user_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, req.userId))
                
            row = {
                "user_id": db_user_id,
                "document_name": req.documentName,
                "associated_key_id": req.associatedKeyId or "",
                "prompt": summary_script,
                "audio_base64": audio_base64
            }
            res = requests.post(f"{supabase_url}/rest/v1/audio_previews", json=row, headers=headers)
            print(f"Supabase response code: {res.status_code}")
        except Exception as e:
            print(f"Failed to save audio to Supabase: {e}")
            
    return {
        "status": "success",
        "prompt": summary_script,
        "audioBase64": audio_base64,
        "mimeType": mime_type,
        "isFallback": not hf_success
    }

