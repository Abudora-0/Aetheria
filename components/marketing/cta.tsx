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
        className="panel relative overflow-hidden px-8 py-16 text-center"
      >
        <AuroraBackdrop />
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
