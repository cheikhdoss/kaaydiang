"use client"
import { motion } from "framer-motion"
import { BookOpen, Code, Database, Globe, Layers, Terminal } from "lucide-react"

const modules = [
  { id: 1, title: "Fondamentaux React", icon: Layers, color: "#3054ff", duration: "2h 30" },
  { id: 2, title: "Architecture Backend", icon: Database, color: "#9791fe", duration: "4h 15" },
  { id: 3, title: "DevOps & Cloud", icon: Globe, color: "#3054ff", duration: "3h 45" },
  { id: 4, title: "Algorithmie Avancée", icon: Code, color: "#9791fe", duration: "5h 00" },
  { id: 5, title: "Sécurité Web", icon: Terminal, color: "#3054ff", duration: "2h 15" },
]

export function CurriculumAdaptivePreview() {
  return (
    <div className="w-full h-full p-6 flex flex-col gap-4 overflow-hidden relative group">
      {/* Header simulateur */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#3054ff] animate-pulse" />
          <span className="text-[10px] font-bold text-[#3054ff] tracking-widest uppercase">AI Path Generator</span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/10" />
          ))}
        </div>
      </div>

      {/* Modules animés */}
      <div className="flex flex-col gap-3 relative z-10">
        {modules.map((module, index) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ x: 10, backgroundColor: "rgba(48, 84, 255, 0.1)" }}
            className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm transition-all cursor-default"
          >
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${module.color}15`, border: `1px solid ${module.color}30` }}
            >
              <module.icon className="w-5 h-5" style={{ color: module.color }} />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-white mb-1">{module.title}</h4>
              <div className="flex items-center gap-3">
                <span className="text-[9px] text-gray-500 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> {module.duration}
                </span>
                <div className="h-1 w-12 bg-white/5 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: "100%" }}
                     transition={{ duration: 1.5, delay: 0.5 + index * 0.1 }}
                     className="h-full" 
                     style={{ backgroundColor: module.color }}
                   />
                </div>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-[#3054ff]/5 to-transparent blur-3xl opacity-50" />
         <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
         </svg>
      </div>
    </div>
  )
}
