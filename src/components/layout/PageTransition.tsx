import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  isLoading?: boolean;
}

const PageTransition = ({ children, isLoading = false }: PageTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.15, ease: 'easeInOut' }}
    >
      {isLoading ? (
        <div className="w-full h-[50vh] flex items-center justify-center">
          <div className="animate-pulse-subtle flex flex-col items-center gap-3">
            <div className="h-8 w-48 rounded-md bg-accent animate-pulse"></div>
            <div className="text-muted-foreground text-sm">Carregando...</div>
          </div>
        </div>
      ) : (
        children
      )}
    </motion.div>
  );
};

export default PageTransition;