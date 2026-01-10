import React, { useEffect, useState, useContext, useRef } from 'react';
import { 
  Box, Container, Paper, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, LinearProgress,
  Grid, TextField, MenuItem, Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import Header from '../../components/Header';
import api from '../../services/api';
import { SemesterContext } from '../../context/SemesterContext';

const AcademicReport = () => {
  const { selectedSemester, selectedSemesterCode } = useContext(SemesterContext);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Refs (Texto)
  const registrationRef = useRef(null);
  const studentNameRef = useRef(null);
  const courseNameRef = useRef(null);
  
  // State (Select)
  const [status, setStatus] = useState('');

  const fetchRecords = () => {
    if (!selectedSemester) return;
    setLoading(true);

    const params = new URLSearchParams();
    params.append('semester_id', selectedSemester);
    
    if (registrationRef.current?.value) params.append('registration', registrationRef.current.value);
    if (studentNameRef.current?.value) params.append('student_name', studentNameRef.current.value);
    if (courseNameRef.current?.value) params.append('course_name', courseNameRef.current.value);
    
    // Usa o State
    if (status) params.append('status', status);

    api.get(`/reports/records?${params.toString()}`)
       .then(res => setRecords(res.data))
       .catch(err => console.error(err))
       .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSemester]);

  const handleClear = () => {
    if(registrationRef.current) registrationRef.current.value = '';
    if(studentNameRef.current) studentNameRef.current.value = '';
    if(courseNameRef.current) courseNameRef.current.value = '';
    
    setStatus(''); // Reseta o select visualmente
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" color="primary" fontWeight="bold">
            Relatório Acadêmico - {selectedSemesterCode}
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 2 }} alignItems="center">
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
                    onChange={(e) => setStatus(e.target.value)}
                    size="small"
                >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="Em regularidade">Em regularidade</MenuItem>
                    <MenuItem value="PAE">PAE</MenuItem>
                    <MenuItem value="PIC">PIC</MenuItem>
                    <MenuItem value="Bloqueio de matricula">Bloqueio de matricula</MenuItem>
                    <MenuItem value="Desligamento">Desligamento</MenuItem>
                </TextField>
            </Grid>
            <Grid item xs={12} sm={2} sx={{display:'flex', gap: 1}}>
                <Button variant="contained" onClick={fetchRecords}><SearchIcon/></Button>
                <Button variant="outlined" onClick={handleClear}><ClearIcon/></Button>
            </Grid>
          </Grid>
        </Paper>

        {loading && <LinearProgress />}
        {/* Tabela... (sem alterações) */}
        <TableContainer component={Paper}>
            <Table size="small">
                {/* ...conteúdo da tabela... */}
                <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell><b>Matrícula</b></TableCell>
                    <TableCell><b>Aluno</b></TableCell>
                    <TableCell><b>Curso</b></TableCell>
                    <TableCell><b>Status</b></TableCell>
                    <TableCell><b>Detalhe</b></TableCell>
                    <TableCell align="center"><b>% Concluído</b></TableCell>
                    <TableCell align="center"><b>Pendentes</b></TableCell>
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
                </TableBody>
            </Table>
        </TableContainer>
      </Container>
    </Box>
  );
};

export default AcademicReport;