import React from 'react';

interface DragRegionProps {
  onDoubleClick?: () => void;
}

export const DragRegion: React.FC<DragRegionProps> = ({ onDoubleClick }) => {
  // Detectar si estamos en Electron
  const isElectron = !!(window as any).require;

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isElectron && onDoubleClick) {
      onDoubleClick();
    }
  };

  if (!isElectron) {
    return null;
  }

  // Solo devuelve el event handler, el CSS se encarga del drag
  return (
    <div
      onDoubleClick={handleDoubleClick}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100%',
        zIndex: 0,
        pointerEvents: 'auto',
        cursor: 'default',
      }}
    />
  );
};