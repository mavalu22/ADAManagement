import React, { useEffect, useState, useContext } from 'react';
import { Box, Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress } from '@mui/material';
import Header from '../../components/Header';
import api from '../../services/api';
import { SemesterContext } from '../../context/SemesterContext';
import { IconButton, Tooltip } from '@mui/material'; // Adicione
import TimelineIcon from '@mui/icons-material/Timeline'; // Ícone novo
import { useNavigate } from 'react-router-dom'; // Adicione

const StudentsReport = () => {
  const navigate = useNavigate(); // Hook de navegação
  const { selectedSemester, selectedSemesterCode } = useContext(SemesterContext);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedSemester) {
        setLoading(true);
        // Busca apenas alunos ativos neste semestre
        api.get(`/reports/students?semester_id=${selectedSemester}`)
           .then(res => setStudents(res.data))
           .finally(() => setLoading(false));
    }
  }, [selectedSemester]);

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
         <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" color="primary" fontWeight="bold">
                Alunos Ativos em {selectedSemesterCode}
            </Typography>
         </Paper>
        
        {loading && <LinearProgress />}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><b>Matrícula</b></TableCell>
                <TableCell><b>Nome</b></TableCell>
                <TableCell><b>Curso</b></TableCell>
                <TableCell><b>Ano Ingresso</b></TableCell>
                <TableCell><b>Cota</b></TableCell>
                <TableCell align="center"><b>Ações</b></TableCell> {/* Nova Coluna */}
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.ID} hover>
                  <TableCell>{s.registration}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.course?.name}</TableCell>
                  <TableCell>{s.entry_year} ({s.entry_period})</TableCell>
                  <TableCell>{s.quota_type}</TableCell>
                  
                  {/* Botão de Ação */}
                  <TableCell align="center">
                    <Tooltip title="Ver Histórico Completo">
                        <IconButton 
                            color="primary" 
                            onClick={() => navigate(`/students/${s.registration}`)}
                        >
                            <TimelineIcon />
                        </IconButton>
                    </Tooltip>
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </Box>
  );
};

export default StudentsReport;