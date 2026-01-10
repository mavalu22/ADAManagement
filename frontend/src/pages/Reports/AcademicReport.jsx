import React, { useEffect, useState, useContext, useRef } from 'react';
import { 
  Box, Container, Paper, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, LinearProgress,
  Grid, TextField, MenuItem, Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useSearchParams } from 'react-router-dom'; // <--- IMPORTANTE

import Header from '../../components/Header';
import api from '../../services/api';
import { SemesterContext } from '../../context/SemesterContext';

const AcademicReport = () => {
  const { selectedSemester, selectedSemesterCode } = useContext(SemesterContext);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams(); // Ler URL

  // Refs
  const registrationRef = useRef(null);
  const studentNameRef = useRef(null);
  const courseNameRef = useRef(null);
  
  // State do Select
  // Inicializa o estado lendo a URL (para o clique do gráfico funcionar visualmente)
  const [status, setStatus] = useState(searchParams.get('status') || '');

  const fetchRecords = () => {
    if (!selectedSemester) return;
    setLoading(true);

    const params = new URLSearchParams();
    params.append('semester_id', selectedSemester);
    
    // 1. Prioridade: Filtros da URL (Dashboard Actions)
    const mode = searchParams.get('mode');
    const maxPending = searchParams.get('max_pending');
    const urlStatus = searchParams.get('status');

    if (mode) params.append('mode', mode);
    if (maxPending) params.append('max_pending', maxPending);
    
    // 2. Filtros Manuais (Inputs)
    // Se tiver status na URL, usa ele, senão usa o do State local
    const currentStatus = urlStatus || status; 
    
    if (registrationRef.current?.value) params.append('registration', registrationRef.current.value);
    if (studentNameRef.current?.value) params.append('student_name', studentNameRef.current.value);
    if (courseNameRef.current?.value) params.append('course_name', courseNameRef.current.value);
    if (currentStatus) params.append('status', currentStatus);

    api.get(`/reports/records?${params.toString()}`)
       .then(res => setRecords(res.data))
       .catch(err => console.error(err))
       .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Atualiza o state visual se a URL mudar (ex: navegação)
    const urlStatus = searchParams.get('status');
    if (urlStatus) setStatus(urlStatus);
    
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSemester, searchParams]); // Recarrega se a URL mudar

  const handleClear = () => {
    if(registrationRef.current) registrationRef.current.value = '';
    if(studentNameRef.current) studentNameRef.current.value = '';
    if(courseNameRef.current) courseNameRef.current.value = '';
    setStatus('');
    setSearchParams({}); // Limpa a URL também
  };

  // Texto dinâmico do título caso venha do dashboard
  let title = `Relatório Acadêmico - ${selectedSemesterCode}`;
  if (searchParams.get('mode') === 'critical') title = `Relatório: Alunos em Situação Crítica (${selectedSemesterCode})`;
  if (searchParams.get('max_pending')) title = `Relatório: Possíveis Formandos (${selectedSemesterCode})`;

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" color="primary" fontWeight="bold">
            {title}
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 2 }} alignItems="center">
            {/* Inputs continuam iguais */}
            <Grid item xs={12} sm={2}>
                <TextField fullWidth label="Matrícula" inputRef={registrationRef} size="small" />
            </Grid>
            <Grid item xs={12} sm={3}>
                <TextField fullWidth label="Aluno" inputRef={studentNameRef} size="small" />
            </Grid>
            <Grid item xs={12} sm={3}>
                <TextField fullWidth label="Curso" inputRef={courseNameRef} size="small" />
            </Grid>
            <Grid item xs={12} sm={2}>
                <TextField 
                    select fullWidth label="Status" 
                    value={status}
                    onChange={(e) => {
                        setStatus(e.target.value);
                        // Ao mudar manualmente, removemos filtros especiais da URL para evitar conflito
                        const newParams = new URLSearchParams(searchParams);
                        newParams.delete('mode');
                        newParams.delete('max_pending');
                        // Atualiza o parametro status na URL
                        if(e.target.value) newParams.set('status', e.target.value);
                        else newParams.delete('status');
                        setSearchParams(newParams);
                    }}
                    size="small"
                >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="Em regularidade">Em regularidade</MenuItem>
                    <MenuItem value="Risco de Evasão">Risco de Evasão</MenuItem>
                    <MenuItem value="Desligamento">Desligamento</MenuItem>
                    {/* Adicione outros status conforme seu banco */}
                </TextField>
            </Grid>
            <Grid item xs={12} sm={2} sx={{display:'flex', gap: 1}}>
                <Button variant="contained" onClick={fetchRecords}><SearchIcon/></Button>
                <Button variant="outlined" onClick={handleClear}><ClearIcon/></Button>
            </Grid>
          </Grid>
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
                <TableCell align="center"><b>Materias Obrigatórias Pendentes</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((row) => {
                 const progress = row.total_hours > 0 ? (row.integralized_hours / row.total_hours) * 100 : 0;
                 return (
                  <TableRow key={row.ID} hover>
                    <TableCell>{row.student?.registration}</TableCell>
                    <TableCell>{row.student?.name}</TableCell>
                    <TableCell>{row.student?.course?.name}</TableCell>
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
              {records.length === 0 && !loading && (
                  <TableRow><TableCell colSpan={7} align="center">Nenhum registro encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </Box>
  );
};

export default AcademicReport;