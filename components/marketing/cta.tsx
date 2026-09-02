"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { AetheriaMark } from "@/components/brand/aetheria-mark";
import { AuroraBackdrop } from "@/components/visual/aurora-backdrop";
import { ButtonLink } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section className="relative z-10 mx-auto max-w-[var(--shell-max)] px-6 pb-28">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="group panel relative overflow-hidden px-6 py-14 text-center sm:px-8 sm:py-16"
      >
        <AuroraBackdrop />
        <div
          className="pointer-events-none absolute inset-0 -translate-x-full opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100"
          style={{
            background:
              "linear-gradient(105deg, transparent 40%, color-mix(in oklab, var(--aurora-violet) 22%, transparent) 50%, transparent 60%)",
          }}
        />
        <div className="relative z-10 flex flex-col items-center">
          <AetheriaMark size={56} />
          <h2 className="mt-6 max-w-xl text-balance text-4xl md:text-5xl">
            Your next post is already scheduled. You just have not written it yet.
          </h2>
          <p className="mt-4 max-w-md text-[var(--muted-foreground)]">
            Free forever for two channels. No card, no lock in, export whenever.
          </p>
          <div className="mt-8">
            <ButtonLink href="/sign-up" size="lg">
              Create your workspace <ArrowRight size={16} />
            </ButtonLink>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
