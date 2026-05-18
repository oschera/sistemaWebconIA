import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Shield, Zap, Code } from 'lucide-react';

// 1. Variantes para el contenedor principal (Efecto Cascada / Stagger)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1, // Espera un momento antes de iniciar los hijos
      staggerChildren: 0.08 // Tiempo de diferencia entre la entrada de cada tarjeta
    }
  }
};

// 2. Variantes para cada Tarjeta Individual
const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 16 // Empieza un poco más abajo
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.4, 
      ease: [0.215, 0.610, 0.355, 1.000] // Curve cubic-bezier premium (fácil salida)
    }
  }
};

const features = [
  { title: "Despliegue Inmediato", desc: "Sube tu código a producción en cuestión de segundos mediante pipelines optimizados con IA.", icon: <Zap size={20} />, color: "text-amber-500 bg-amber-50" },
  { title: "Seguridad Avanzada", desc: "Cifrado de extremo a extremo de grado militar con aislamiento de base de datos integrado.", icon: <Shield size={20} />, color: "text-blue-600 bg-blue-50" },
  { title: "API de Alto Rendimiento", desc: "Endpoints con tiempos de respuesta inferiores a 40ms distribuidos globalmente por Edge.", icon: <Code size={20} />, color: "text-purple-600 bg-purple-50" },
];

export const SaaSGrid = () => {
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-6 antialiased">
      <div className="max-w-5xl w-full space-y-10">
        
        {/* Encabezado animado directamente en línea */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center space-y-3"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-600">
            <Sparkles size={12} /> Características Globales
          </span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
            Herramientas creadas para desarrolladores
          </h2>
        </motion.div>

        {/* CONTENEDOR DE LA GRILLA (Aplica las variantes de cascada) */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {features.map((item, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              
              // 3. MICROINTERACCIONES DE HOVER Y PRESS (TÁCTIL)
              whileHover={{ 
                y: -4, // Se eleva sutilmente
                borderColor: "rgba(147, 51, 234, 0.4)", // Cambia el borde de forma suave
                shadow: "0px 10px 30px rgba(0, 0, 0, 0.04)"
              }}
              whileTap={{ scale: 0.98 }} // Efecto de hundimiento tridimensional al hacer clic
              
              className="relative flex flex-col justify-between p-6 bg-white border border-slate-200/80 rounded-2xl cursor-pointer select-none transition-colors duration-200 group"
            >
              <div className="space-y-4">
                {/* Contenedor del Icono */}
                <div className={`p-3 rounded-xl w-fit ${item.color}`}>
                  {item.icon}
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-800 tracking-tight text-lg group-hover:text-purple-600 transition-colors duration-150">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              </div>

              {/* Botón de acción con microinteracción interna */}
              <div className="flex items-center gap-1 text-xs font-bold text-slate-400 mt-6 group-hover:text-purple-600 transition-colors duration-150">
                <span>Saber más</span>
                
                {/* Animamos el icono interno basándonos en el hover de la tarjeta */}
                <motion.div
                  variants={{
                    hover: { x: 4 }
                  }}
                  className="transform group-hover:translate-x-1 transition-transform duration-200"
                >
                  <ArrowRight size={14} />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};