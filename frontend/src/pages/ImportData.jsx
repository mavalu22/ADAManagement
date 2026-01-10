import React, { useState, useContext } from 'react'; // 1. Adicione useContext
import { Box, Button, Container, Typography, Paper, Alert, LinearProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Header from '../components/Header';
import api from '../services/api';
import { toast } from 'react-toastify';
// 2. Importe o Contexto
import { SemesterContext } from '../context/SemesterContext';

const ImportData = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // 3. Pegue a função de recarregar do contexto
  const { refreshSemesters } = useContext(SemesterContext);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.warning("Selecione um arquivo CSV ou XLSX primeiro.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Dados importados com sucesso!");
      setFile(null);
      
      // 4. MÁGICA AQUI: Avisa o sistema para buscar os novos semestres
      refreshSemesters();
      
    } catch (error) {
      console.error(error);
      toast.error("Erro na importação. Verifique o formato do arquivo.");
    } finally {
      setLoading(false);
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
              border: '2px dashed #ccc', 
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
            />
            <label htmlFor="raised-button-file">
              <Button variant="outlined" component="span">
                Escolher Arquivo
              </Button>
            </label>
            {file && (
              <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold' }}>
                Arquivo selecionado: {file.name}
              </Typography>
            )}
          </Box>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          <Button 
            variant="contained" 
            size="large" 
            onClick={handleUpload}
            disabled={loading || !file}
            fullWidth
          >
            {loading ? "Processando..." : "Importar Planilha"}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default ImportData;