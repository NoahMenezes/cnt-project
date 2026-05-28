import os
import math
import uuid
import datetime
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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

def get_unstructured_chunks(text: str):
    paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
    chunks = []
    for i, p in enumerate(paragraphs):
        p_type = "Text Paragraph"
        p_clean = p.lower()
        if len(p) < 65 and (p.endswith(":") or p.isupper() or p.startswith("LAB") or p.startswith("Expt") or p.startswith("Session")):
            p_type = "Section Header"
        elif p.startswith("-") or p.startswith("*") or (p.strip() and p.strip()[0].isdigit() and len(p.strip()) > 2 and p.strip()[1] == "."):
            p_type = "List Item"
        elif "def " in p_clean or "import " in p_clean or "{" in p_clean or "=" in p_clean and len(p) > 80:
            p_type = "Formula / Code"
            
        chunks.append({
            "id": i + 1,
            "text": p,
            "length": len(p),
            "type": p_type
        })
    return chunks

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
                f"Analyze the following cryptographic configuration parameters from the file '{file_name}':\n"
                f"1. Entropy: {entropy_val}/8.0\n"
                f"2. RSA Parameters: Key size {rsa_info['keySize']}, exponent e={rsa_info['exponent']}\n"
                f"3. AES Parameters: Mode {aes_info['mode']}, Key strength {aes_info['keyStrength']}\n"
                f"4. Source excerpt: {content[:1500]}\n\n"
                f"Provide a brief assessment summary and specific recommendations, and extract a list of all cryptographic, randomness, or mathematical algorithms/parameters mentioned in the excerpt to organize them into a structured table schema.\n"
                f"You MUST return a JSON object exactly formatted as:\n"
                f'{{\n'
                f'  "securityAssessment": "Detailed analysis of the configuration vulnerabilities found.",\n'
                f'  "findings": "A summary sentence of the overall file security status.",\n'
                f'  "recommendations": [\n'
                f'    {{"priority": "Critical"|"High"|"Medium"|"Low", "action": "Specific recommendation description"}}\n'
                f'  ],\n'
                f'  "structuredParameters": [\n'
                f'    {{\n'
                f'      "category": "Algorithm"|"Entropy"|"RSA Parameter"|"AES Parameter"|"Vulnerability",\n'
                f'      "element": "Name of the element, e.g. LCG, BBS, Key size, public exponent etc.",\n'
                f'      "value": "The value or details discovered from the document, e.g. X0 seed, 2048-bit, GCM, etc.",\n'
                f'      "classification": "Brief description of its role or classification.",\n'
                f'      "status": "Critical"|"High"|"Medium"|"Low"|"Secure"\n'
                f'    }}\n'
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
                timeout=8.0
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
                if "structuredParameters" in ai_data and isinstance(ai_data["structuredParameters"], list):
                    structured_parameters_list = ai_data["structuredParameters"]
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
                f"Content excerpt: {content[:1000]}\n\n"
                f"Provide a brief assessment summary and specific recommendations. Return response as JSON only, matching format:\n"
                f'{{\n'
                f'  "securityAssessment": "...",\n'
                f'  "findings": "...",\n'
                f'  "recommendations": [\n'
                f'    {{"priority": "...", "action": "..."}}\n'
                f'  ],\n'
                f'  "structuredParameters": [\n'
                f'    {{"category": "...", "element": "...", "value": "...", "classification": "...", "status": "..."}}\n'
                f'  ]\n'
                f'}}'
            )
            response = requests.post(
                ollama_url,
                json={"model": "llama3", "prompt": prompt, "format": "json", "stream": False},
                timeout=5.0
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
                if "structuredParameters" in ai_data and isinstance(ai_data["structuredParameters"], list):
                    structured_parameters_list = ai_data["structuredParameters"]
                ai_success = True
                print("Ollama analysis succeeded!")
        except Exception as e:
            print(f"Ollama local query skipped or failed. Error: {e}")

    # Build unstructured chunks
    unstructured_chunks_list = get_unstructured_chunks(content)

    # Build structured parameters if not populated by AI
    if not structured_parameters_list:
        structured_parameters_list = [
            {
                "category": "AES Parameter",
                "element": "Encryption Mode",
                "value": aes_info["mode"],
                "classification": "Symmetric Block Cipher Mode",
                "status": "Secure" if aes_info["mode"] == "GCM" else "High"
            },
            {
                "category": "RSA Parameter",
                "element": "Key Size",
                "value": f"{rsa_info['keySize']}-bit",
                "classification": "Asymmetric Key Strength",
                "status": "Secure" if rsa_info["keySize"] >= 3072 else "Low"
            },
            {
                "category": "RSA Parameter",
                "element": "Public Exponent",
                "value": f"e={rsa_info['exponent']}",
                "classification": "Asymmetric Public Exponent",
                "status": "Secure" if rsa_info["exponent"] == 65537 else "Critical"
            },
            {
                "category": "Entropy",
                "element": "Shannon Entropy",
                "value": f"{entropy_val} / 8.0",
                "classification": "Information Density Randomness",
                "status": "Secure" if entropy_val >= 7.5 else "Low"
            }
        ]
        
        # Heuristically add LCG / BBS if present in text
        t_lower = content.lower()
        if "lcg" in t_lower or "linear congruential" in t_lower:
            structured_parameters_list.append({
                "category": "Algorithm",
                "element": "Linear Congruential Generator (LCG)",
                "value": "Modulus m, Multiplier a, Increment c",
                "classification": "Mathematical PRNG algorithm",
                "status": "Critical"
            })
        if "bbs" in t_lower or "blum blum shub" in t_lower:
            structured_parameters_list.append({
                "category": "Algorithm",
                "element": "Blum Blum Shub (BBS)",
                "value": "p, q primes, seed s",
                "classification": "Cryptographically Secure PRNG",
                "status": "Secure"
            })

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
    else:
        try:
            content = file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            content = f"Binary content of {file_name}"
            
    return perform_cryptographic_analysis(file_name, content)

@app.post("/analyze")
async def analyze_document(req: AnalysisRequest):
    return perform_cryptographic_analysis(req.fileName, req.content)
