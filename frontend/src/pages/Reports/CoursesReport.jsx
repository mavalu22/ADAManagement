import React, { useEffect, useState } from 'react';
import { Box, Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import Header from '../../components/Header';
import api from '../../services/api';

const CoursesReport = () => {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
      api.get('/reports/courses').then(res => setCourses(res.data));
  }, []);

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h5" color="primary" fontWeight="bold" gutterBottom>
            Cursos Cadastrados
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><b>Código</b></TableCell>
                <TableCell><b>Nome do Curso</b></TableCell>
                <TableCell><b>Coordenador</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courses.map((c) => (
                <TableRow key={c.ID}>
                  <TableCell>{c.code}</TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.coordinator}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </Box>
  );
};

export default CoursesReport;