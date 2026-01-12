import React, { useEffect, useState, useRef } from 'react';
import { 
  Box, Container, Paper, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Grid, TextField, Button 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import Header from '../../components/Header';
import api from '../../services/api';

const CoursesReport = () => {
  const [courses, setCourses] = useState([]);
  
  // Refs para os campos (Performance)
  const codeRef = useRef(null);
  const nameRef = useRef(null);

  const fetchCourses = () => {
      const params = new URLSearchParams();
      
      // Leitura direta dos valores
      if (codeRef.current?.value) params.append('code', codeRef.current.value);
      if (nameRef.current?.value) params.append('name', nameRef.current.value);

      api.get(`/reports/courses?${params.toString()}`).then(res => setCourses(res.data));
  };

  useEffect(() => {
     fetchCourses();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Limpeza visual dos campos
  const handleClear = () => {
      if (codeRef.current) codeRef.current.value = '';
      if (nameRef.current) nameRef.current.value = '';
      // fetchCourses(); // Descomente se quiser recarregar ao limpar
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        
        <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" color="primary" fontWeight="bold" gutterBottom>
                Cursos Cadastrados
            </Typography>

            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                    <TextField fullWidth label="Código" inputRef={codeRef} size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Nome do Curso" inputRef={nameRef} size="small" />
                </Grid>
                <Grid item xs={12} sm={3} sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" startIcon={<SearchIcon />} onClick={fetchCourses}>Filtrar</Button>
                    <Button variant="outlined" onClick={handleClear}><ClearIcon /></Button>
                </Grid>
            </Grid>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><b>Código</b></TableCell>
                <TableCell><b>Nome do Curso</b></TableCell>
                <TableCell><b>Coordenador</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courses.length > 0 ? (
                courses.map((c) => (
                  <TableRow key={c.ID}>
                    <TableCell>{c.code}</TableCell>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.coordinator}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </Box>
  );
};

export default CoursesReport;