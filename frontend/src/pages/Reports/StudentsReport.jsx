import React, { useEffect, useState, useContext, useRef } from 'react';
import { 
  Box, Container, Paper, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, LinearProgress, Grid, TextField, 
  MenuItem, Button, IconButton, Tooltip 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import api from '../../services/api';
import { SemesterContext } from '../../context/SemesterContext';

const StudentsReport = () => {
  const navigate = useNavigate();
  const { selectedSemester, selectedSemesterCode } = useContext(SemesterContext);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // REFS para Textos (Performance)
  const registrationRef = useRef(null);
  const nameRef = useRef(null);
  const entryYearRef = useRef(null);
  
  // STATE para Select (Para funcionar o Limpar visualmente)
  const [quotaType, setQuotaType] = useState(''); 

  const fetchStudents = () => {
    if (!selectedSemester) return;

    setLoading(true);
    const params = new URLSearchParams();
    
    params.append('semester_id', selectedSemester);

    // Refs
    if (registrationRef.current?.value) params.append('registration', registrationRef.current.value);
    if (nameRef.current?.value) params.append('name', nameRef.current.value);
    if (entryYearRef.current?.value) params.append('entry_year', entryYearRef.current.value);
    
    // State
    if (quotaType) params.append('quota_type', quotaType);

    api.get(`/reports/students?${params.toString()}`)
       .then(res => setStudents(res.data))
       .catch(err => console.error(err))
       .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSemester]); 

  const handleClear = () => {
    // Limpa Refs
    if(registrationRef.current) registrationRef.current.value = '';
    if(nameRef.current) nameRef.current.value = '';
    if(entryYearRef.current) entryYearRef.current.value = '';
    
    // Limpa State do Select
    setQuotaType('');
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
           <Typography variant="h5" color="primary" fontWeight="bold" gutterBottom>
               Alunos Ativos em {selectedSemesterCode}
           </Typography>
           
           <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
              <Grid item xs={12} sm={2}>
                 <TextField fullWidth label="Matrícula" inputRef={registrationRef} size="small" />
              </Grid>
              <Grid item xs={12} sm={4}>
                 <TextField fullWidth label="Nome" inputRef={nameRef} size="small" />
              </Grid>
              <Grid item xs={6} sm={2}>
                 <TextField fullWidth label="Ano" type="number" inputRef={entryYearRef} size="small" />
              </Grid>
              <Grid item xs={6} sm={2}>
                 {/* Select CONTROLADO por State */}
                 <TextField 
                    select fullWidth label="Cota" 
                    value={quotaType} 
                    onChange={(e) => setQuotaType(e.target.value)} 
                    size="small"
                 >
                    <MenuItem value="">Todas</MenuItem>
                    <MenuItem value="Ampla concorrência">Ampla concorrência</MenuItem>
                    <MenuItem value="Candidato BR, EP">Candidato BR, EP</MenuItem>
                    <MenuItem value="Candidato IR, EP">Candidato IR, EP</MenuItem>
                    <MenuItem value="Baixa Renda e PPI, até 1,5SM/P, Deficiente">Baixa Renda e PPI, até 1,5SM/P, Deficiente</MenuItem>
                    <MenuItem value="Renda Normal e Não PPI">Renda Normal e Não PPI</MenuItem>
                    <MenuItem value="Candidato PPI, IR, EP">Candidato PPI, IR, EP</MenuItem>
                    <MenuItem value="Baixa Renda e Não PPI">Baixa Renda e Não PPI</MenuItem>
                    <MenuItem value="Candidato PPI, BR, EP">Candidato PPI, BR, EP</MenuItem>
                 </TextField>
              </Grid>
              <Grid item xs={12} sm={2} sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" onClick={fetchStudents} sx={{ minWidth: '40px' }}><SearchIcon /></Button>
                  <Button variant="outlined" onClick={handleClear} sx={{ minWidth: '40px' }}><ClearIcon /></Button>
              </Grid>
           </Grid>
        </Paper>
        
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><b>Matrícula</b></TableCell>
                <TableCell><b>Nome</b></TableCell>
                <TableCell><b>Curso</b></TableCell>
                <TableCell><b>Ano Ingresso</b></TableCell>
                <TableCell><b>Cota</b></TableCell>
                <TableCell align="center"><b>Ações</b></TableCell>
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
                  <TableCell align="center">
                    <Tooltip title="Ver Histórico Completo">
                        <IconButton color="primary" onClick={() => navigate(`/students/${s.registration}`)}>
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