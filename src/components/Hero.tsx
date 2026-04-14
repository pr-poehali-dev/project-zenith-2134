import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";

export default function Hero() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0vh", "50vh"]);

  return (
    <div
      ref={container}
      className="relative flex items-center justify-center h-screen overflow-hidden"
    >
      <motion.div
        style={{ y }}
        className="absolute inset-0 w-full h-full"
      >
        <img
          src="/images/mountain-landscape.jpg"
          alt="Mountain landscape"
          className="w-full h-full object-cover"
        />
      </motion.div>

      <div className="relative z-10 text-center text-white px-6">
        <p className="text-xs md:text-sm uppercase tracking-[0.3em] mb-4 opacity-70">Стратегия контроля антимикробной терапии</p>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-tight">
          СКАТ·БОТ
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90 leading-relaxed">
          Интеллектуальный помощник для выбора антибактериальной терапии на основе протоколов СКАТ
        </p>
        <Link
          to="/bot"
          className="inline-block mt-8 border border-white text-white px-8 py-3 text-sm uppercase tracking-wide hover:bg-white hover:text-neutral-900 transition-all duration-300"
        >
          Узнать больше
        </Link>
      </div>
    </div>
  );
}