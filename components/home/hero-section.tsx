"use client";

import { Instrument_Serif } from "next/font/google";
import { motion } from "motion/react";
import { VideoText } from "@/components/ui/video-text";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
});

function HeroSection() {
  return (
    <section className="min-h-[calc(100vh-80px)] flex items-center justify-center">
      <div className="w-full relative py-12">
        <div className="relative w-full before:absolute before:w-full before:h-full before:bg-linear-to-r before:from-sky-100 before:via-white before:to-amber-100 before:rounded-full before:top-24 before:blur-3xl before:-z-10 dark:before:from-slate-800 dark:before:via-black dark:before:to-stone-700 dark:before:rounded-full dark:before:blur-3xl dark:before:-z-10">
          <div className="container mx-auto relative z-10">
            <div className="flex flex-col max-w-5xl mx-auto items-center justify-center">
              <motion.h1
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeInOut" }}
                className="w-full flex flex-col items-center select-none text-center"
              >
                <VideoText
                  src="https://cdn.magicui.design/ocean-small.webm"
                  fontSize="7.5vw"
                  fontWeight="500"
                  fontFamily="system-ui, sans-serif"
                  className="h-[12vw] min-h-[60px] md:min-h-[100px] w-full"
                >
                  CipherScope
                </VideoText>
                <VideoText
                  src="https://cdn.magicui.design/ocean-small.webm"
                  fontSize="4.5vw"
                  fontWeight="400"
                  fontStyle="italic"
                  fontFamily={instrumentSerif.style.fontFamily}
                  className="h-[8vw] min-h-[40px] md:min-h-[70px] w-full"
                >
                  Crypto Forensics Lab
                </VideoText>
              </motion.h1>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
