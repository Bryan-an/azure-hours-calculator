import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Minimize';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import { electronUtils } from '../utils/electronUtils';

interface ElectronTitleBarProps {
  onSettingsClick: () => void;
}

export const ElectronTitleBar: React.FC<ElectronTitleBarProps> = ({
  onSettingsClick,
}) => {
  const handleClose = () => {
    const currentWindow = electronUtils.getCurrentWindow();

    if (currentWindow && typeof currentWindow.close === 'function') {
      currentWindow.close();
    }
  };

  const handleMinimize = () => {
    const currentWindow = electronUtils.getCurrentWindow();

    if (currentWindow && typeof currentWindow.minimize === 'function') {
      currentWindow.minimize();
    }
  };

  const handleMaximize = () => {
    electronUtils.toggleMaximize();
  };

  const handleDoubleClick = () => {
    electronUtils.toggleMaximize();
  };

  return (
    <Box
      className="electron-titlebar"
      onDoubleClick={handleDoubleClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: '32px',
        backgroundColor: '#1e1e1e',
        borderBottom: '1px solid #333',
        WebkitAppRegion: 'drag',
        WebkitUserSelect: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        width: '100%',
      }}
    >
      {/* Controles de ventana (solo en Windows/Linux) */}
      {process.platform !== 'darwin' && (
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
          <IconButton
            size="small"
            onClick={handleMinimize}
            sx={{
              WebkitAppRegion: 'no-drag',
              color: '#fff',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
            }}
          >
            <MinimizeIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            onClick={handleMaximize}
            sx={{
              WebkitAppRegion: 'no-drag',
              color: '#fff',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
            }}
          >
            <CropSquareIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            onClick={handleClose}
            sx={{
              WebkitAppRegion: 'no-drag',
              color: '#fff',
              '&:hover': { backgroundColor: '#e81123' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Título */}
      <Typography
        variant="body2"
        sx={{
          flexGrow: 1,
          textAlign: 'center',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 500,
          WebkitAppRegion: 'drag',
        }}
      >
        Azure Hours Calculator
      </Typography>

      {/* Botón de configuración */}
      <IconButton
        size="small"
        onClick={onSettingsClick}
        sx={{
          WebkitAppRegion: 'no-drag',
          color: '#fff',
          mr: process.platform === 'darwin' ? 1 : 0,
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
        }}
      >
        <SettingsIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};
