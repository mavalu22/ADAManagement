import React, { useEffect, useState, useContext } from 'react';
import { Box, Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, LinearProgress } from '@mui/material';
import Header from '../../components/Header';
import api from '../../services/api';
import { SemesterContext } from '../../context/SemesterContext';

const AcademicReport = () => {
  const { selectedSemester, selectedSemesterCode } = useContext(SemesterContext);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedSemester) {
      setLoading(true);
      api.get(`/reports/records?semester_id=${selectedSemester}`)
         .then(res => setRecords(res.data))
         .catch(err => console.error(err))
         .finally(() => setLoading(false));
    }
  }, [selectedSemester]); // RECARREGA QUANDO O HEADER MUDA

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" color="primary" fontWeight="bold">
            Relatório Acadêmico - {selectedSemesterCode}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Mostrando {records.length} registros.
          </Typography>
        </Paper>

        {loading && <LinearProgress />}

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><b>Matrícula</b></TableCell>
                <TableCell><b>Aluno</b></TableCell>
                <TableCell><b>Curso</b></TableCell>
                <TableCell><b>Status</b></TableCell>
                <TableCell><b>Detalhe</b></TableCell>
                <TableCell align="center"><b>% Concluído</b></TableCell>
                <TableCell align="center"><b>Matérias pendentes</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((row) => {
                 const progress = row.total_hours > 0 ? (row.integralized_hours / row.total_hours) * 100 : 0;
                 return (
                  <TableRow key={row.ID} hover>
                    <TableCell>{row.student.registration}</TableCell>
                    <TableCell>{row.student.name}</TableCell>
                    <TableCell>{row.student.course?.name}</TableCell>
                    <TableCell>
                        <Chip 
                            label={row.status} 
                            color={row.status === 'Em regularidade' ? 'success' : 'warning'} 
                            size="small" 
                        />
                    </TableCell>
                    <TableCell sx={{maxWidth: 200, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                        {row.status_detail}
                    </TableCell>
                    <TableCell align="center">{progress.toFixed(1)}%</TableCell>
                    <TableCell align="center">{row.pending_obligatory}</TableCell>
                  </TableRow>
                 )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </Box>
  );
};

export default AcademicReport;