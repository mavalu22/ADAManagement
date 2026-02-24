import React, { useState, useContext, useRef } from 'react';
import { Box, Button, Container, Typography, Paper, LinearProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Header from '../components/Header';
import api from '../services/api';
import { toast } from 'react-toastify';
import { SemesterContext } from '../context/SemesterContext';

const STAGES = {
  uploading:   'Enviando arquivo...',
  processing:  'Processando dados...',
  finalizing:  'Concluindo importação...',
};

const ImportData = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const processingIntervalRef = useRef(null);

  const { refreshSemesters } = useContext(SemesterContext);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const clearProcessingInterval = () => {
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
  };

  const startProcessingSimulation = () => {
    setStage('processing');
    let current = 40;
    processingIntervalRef.current = setInterval(() => {
      current += Math.random() * 2.5 + 0.5;
      if (current >= 88) {
        current = 88;
        clearProcessingInterval();
      }
      setProgress(Math.round(current));
    }, 180);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.warning("Selecione um arquivo CSV ou XLSX primeiro.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setProgress(0);
    setStage('uploading');

    try {
      await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          const uploadPercent = e.total
            ? Math.round((e.loaded * 40) / e.total)
            : 40;
          setProgress(uploadPercent);

          if (e.loaded >= e.total) {
            startProcessingSimulation();
          }
        },
      });

      clearProcessingInterval();
      setStage('finalizing');
      setProgress(100);

      await new Promise((resolve) => setTimeout(resolve, 500));

      toast.success("Dados importados com sucesso!");
      setFile(null);
      refreshSemesters();

    } catch (error) {
      clearProcessingInterval();
      console.error(error);
      toast.error("Erro na importação. Verifique o formato do arquivo.");
    } finally {
      setLoading(false);
      setProgress(0);
      setStage('');
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="md" sx={{ mt: 5 }}>
        <Paper elevation={3} sx={{ p: 5, textAlign: 'center' }}>
          <CloudUploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" color="primary" fontWeight="bold" gutterBottom>
            Importação de Dados Acadêmicos
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
            Faça upload das planilhas (.csv ou .xlsx) exportadas para atualizar a base.
          </Typography>

          <Box
            sx={{
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              p: 4,
              mb: 3,
              bgcolor: 'background.paper',
            }}
          >
            <input
              accept=".csv, .xlsx"
              style={{ display: 'none' }}
              id="raised-button-file"
              type="file"
              onChange={handleFileChange}
              disabled={loading}
            />
            <label htmlFor="raised-button-file">
              <Button variant="outlined" component="span" disabled={loading}>
                Escolher Arquivo
              </Button>
            </label>
            {file && (
              <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold' }}>
                Arquivo selecionado: {file.name}
              </Typography>
            )}
          </Box>

          {loading && (
            <Box sx={{ mb: 3, textAlign: 'left' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {STAGES[stage]}
                </Typography>
                <Typography variant="body2" color="primary" fontWeight={700}>
                  {progress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    transition: 'transform 0.25s ease',
                  },
                }}
              />
            </Box>
          )}

          <Button
            variant="contained"
            size="large"
            onClick={handleUpload}
            disabled={loading || !file}
            fullWidth
          >
            {loading ? STAGES[stage] : "Importar Planilha"}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default ImportData;