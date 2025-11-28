"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInterviewEngine } from "~/hooks/use-interview-engine";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card } from "~/components/ui/card";

interface ImmersiveInterviewProps {
  onComplete?: (agentId: string) => void;
}

export function ImmersiveInterview({ onComplete }: ImmersiveInterviewProps) {
  const {
    currentQuestion,
    collectedFields,
    isLoading,
    error,
    submitAnswer,
    getProgress,
  } = useInterviewEngine();

  const [userInput, setUserInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const result = await submitAnswer(userInput);
    
    if (result?.complete) {
      // Interview complete, call onComplete callback
      if (onComplete) {
        onComplete(result.agentId);
      }
    }
    
    setUserInput("");
    setIsSubmitting(false);
    
    // Focus back to input
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const progress = getProgress();

  if (!currentQuestion) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full" />
          </div>
          <p className="mt-4 text-slate-400">Preparing your interview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Background effects */}
      <BackgroundEffects />

      {/* Main content */}
      <div className="relative z-10 h-screen flex flex-col items-center justify-center px-4 py-8">
        {/* Progress indicator */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Progress: {progress}%
          </div>
          <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-primary"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Glowing crystal */}
        <div className="mb-12 relative w-32 h-32">
          <GlowingCrystal />
        </div>

        {/* Question card with animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl w-full"
          >
            <Card className="bg-slate-900/80 border-slate-700/50 backdrop-blur-sm shadow-2xl">
              <div className="p-8 md:p-12">
                <p className="text-xl md:text-2xl text-slate-50 leading-relaxed mb-8">
                  {currentQuestion}
                </p>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Input form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Input
                      ref={inputRef}
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Share your thoughts..."
                      disabled={isLoading || isSubmitting}
                      className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-primary/50 focus:bg-slate-800/80 h-14"
                      autoFocus
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={!userInput.trim() || isLoading || isSubmitting}
                    className="w-full h-12 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 disabled:opacity-50"
                  >
                    {isSubmitting ? "Processing..." : "Continue"}
                  </Button>
                </form>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Collected fields display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-6 left-6 right-6 max-w-xs"
        >
          <div className="text-xs text-slate-500 space-y-1">
            {Object.entries(collectedFields).map(([key, value]) => (
              value && (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span className="text-slate-400">
                    {key.replace(/_/g, " ")}: {typeof value === "string" && value.substring(0, 30)}
                    {typeof value === "string" && value.length > 30 ? "..." : ""}
                  </span>
                </motion.div>
              )
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Glowing crystal component
function GlowingCrystal() {
  return (
    <div className="relative w-full h-full">
      {/* Outer glow */}
      <motion.div
        className="absolute inset-0 rounded-3xl"
        style={{
          background: "radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.4), transparent)",
          filter: "blur(20px)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Crystal body */}
      <motion.div
        className="absolute inset-2 rounded-3xl"
        style={{
          background: "linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(59, 130, 246, 0.2))",
          backdropFilter: "blur(10px)",
          border: "2px solid rgba(6, 182, 212, 0.5)",
        }}
        animate={{
          rotateX: [0, 360],
          rotateY: [0, 360],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Inner shimmer */}
      <motion.div
        className="absolute inset-4 rounded-2xl"
        style={{
          background: "radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.6), rgba(59, 130, 246, 0.2))",
        }}
        animate={{
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Light rays */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "conic-gradient(from 0deg, transparent, rgba(6, 182, 212, 0.2), transparent)",
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

// Background effects component
function BackgroundEffects() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />

      {/* Soft lights */}
      <motion.div
        className="absolute top-1/4 -left-1/2 w-full h-full rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(6, 182, 212, 0.1), transparent)",
          filter: "blur(80px)",
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <motion.div
        className="absolute bottom-1/4 -right-1/2 w-full h-full rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.08), transparent)",
          filter: "blur(80px)",
        }}
        animate={{
          x: [0, -50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      {/* Particle effect */}
      <ParticleEffect />

      {/* Grid pattern (subtle) */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />
    </div>
  );
}

// Particle effect component
function ParticleEffect() {
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 10 + 10,
  }));

  return (
    <div className="absolute inset-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-cyan-400/30"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -300],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  );
}
