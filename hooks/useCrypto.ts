"use client";

import { useState, useEffect } from "react";
import * as cryptoLib from "@/lib/crypto/core";

export function useCrypto() {
    const [publicKey, setPublicKey] = useState<string | null>(null);
    const [isKeyGenerated, setIsKeyGenerated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if public key is in backend (initial load)
        fetch("/api/user")
            .then((res) => res.json())
            .then((data) => {
                if (data && data.publicKey) {
                    setPublicKey(data.publicKey);
                    setIsKeyGenerated(true);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const generateNewKeyPair = async (password: string) => {
        setLoading(true);
        try {
            const keyPair = await cryptoLib.generateRSAKeyPair();
            const pubKeyBase64 = await cryptoLib.exportPublicKey(keyPair.publicKey);
            const encryptedPriv = await cryptoLib.exportPrivateKey(keyPair.privateKey, password);

            // Save public key to backend
            await fetch("/api/user", {
                method: "POST",
                body: JSON.stringify({ publicKey: pubKeyBase64 }),
            });

            // Save encrypted private key to localStorage
            localStorage.setItem("ss_priv_key", JSON.stringify(encryptedPriv));

            setPublicKey(pubKeyBase64);
            setIsKeyGenerated(true);
        } catch (err) {
            console.error("Key generation failed:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getPrivateKey = async (password: string): Promise<CryptoKey> => {
        const stored = localStorage.getItem("ss_priv_key");
        if (!stored) throw new Error("No private key found locally.");
        const { encryptedKey, salt, iv } = JSON.parse(stored);

        return await cryptoLib.importPrivateKey(encryptedKey, salt, iv, password);
    };

    const clearKeys = () => {
        localStorage.removeItem("ss_priv_key");
        setPublicKey(null);
        setIsKeyGenerated(false);
    };

    return {
        publicKey,
        isKeyGenerated,
        loading,
        generateNewKeyPair,
        getPrivateKey,
        clearKeys,
    };
}
