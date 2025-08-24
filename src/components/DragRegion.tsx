import React from 'react';
import { Box } from '@mui/material';

interface DragRegionProps {
  onDoubleClick?: () => void;
}

export const DragRegion: React.FC<DragRegionProps> = ({ onDoubleClick }) => {
  // Detectar si estamos en Electron
  const isElectron = !!(window as any).require;

  const handleDoubleClick = () => {
    if (isElectron && onDoubleClick) {
      onDoubleClick();
    }
  };

  if (!isElectron) {
    return null;
  }

  return (
    <Box
      className="drag-region"
      onDoubleClick={handleDoubleClick}
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100%',
        zIndex: -1,
        WebkitAppRegion: 'drag',
        WebkitUserSelect: 'none',
        cursor: 'default',
      }}
    />
  );
};