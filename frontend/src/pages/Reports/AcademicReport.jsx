import { useEffect, useState, useContext, useRef } from 'react';
import {
  Box, Container, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, LinearProgress,
  Grid, TextField, MenuItem, Button, IconButton, Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { useSearchParams, useNavigate } from 'react-router-dom';

import Header from '../../components/Header';
import api from '../../services/api';
import { SemesterContext } from '../../context/SemesterContext';

const AcademicReport = () => {
  const navigate = useNavigate();
  const { selectedSemester, selectedSemesterCode } = useContext(SemesterContext);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');

  const registrationRef = useRef(null);
  const studentNameRef = useRef(null);

  const [status, setStatus] = useState(searchParams.get('status') || '');

  useEffect(() => {
    api.get('/reports/courses')
       .then(res => setCourses(res.data))
       .catch(err => console.error('Erro ao carregar cursos:', err));
  }, []);

  const fetchRecords = () => {
    if (!selectedSemester) return;
    setLoading(true);

    const params = new URLSearchParams();
    params.append('semester_id', selectedSemester);

    const mode = searchParams.get('mode');
    const maxPending = searchParams.get('max_pending');
    const urlStatus = searchParams.get('status');

    if (mode) params.append('mode', mode);
    if (maxPending) params.append('max_pending', maxPending);

    const currentStatus = urlStatus || status;

    if (registrationRef.current?.value) params.append('registration', registrationRef.current.value);
    if (studentNameRef.current?.value) params.append('student_name', studentNameRef.current.value);
    if (selectedCourse) params.append('course_name', selectedCourse);
    if (currentStatus) params.append('status', currentStatus);

    api.get(`/reports/records?${params.toString()}`)
       .then(res => setRecords(res.data))
       .catch(err => console.error(err))
       .finally(() => setLoading(false));
  };

  useEffect(() => {
    const urlStatus = searchParams.get('status');
    if (urlStatus) setStatus(urlStatus);

    fetchRecords();
  }, [selectedSemester, searchParams]);

  const handleClear = () => {
    if(registrationRef.current) registrationRef.current.value = '';
    if(studentNameRef.current) studentNameRef.current.value = '';
    setSelectedCourse('');
    setStatus('');
    setSearchParams({});
  };

  let title = `Relatório Acadêmico - ${selectedSemesterCode}`;
  if (searchParams.get('mode') === 'critical') title = `Relatório: Alunos em Situação Crítica (${selectedSemesterCode})`;
  if (searchParams.get('max_pending')) title = `Relatório: Possíveis Formandos (${selectedSemesterCode})`;

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="xl" sx={{ mt: 4 }}>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {records.length} {records.length === 1 ? 'registro' : 'registros'} encontrados
          </Typography>
        </Box>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FilterAltIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            <Typography variant="caption" fontWeight={700} sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Filtros
            </Typography>
          </Box>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={2}>
                <TextField fullWidth label="Matrícula" inputRef={registrationRef} size="small" />
            </Grid>
            <Grid item xs={12} sm={3}>
                <TextField fullWidth label="Aluno" inputRef={studentNameRef} size="small" />
            </Grid>

            <Grid item xs={12} sm={3}>
                <TextField
                    select fullWidth label="Curso"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    size="small"
                >
                    <MenuItem value="">Todos</MenuItem>
                    {courses.map((c) => (
                        <MenuItem key={c.ID} value={c.name}>{c.name}</MenuItem>
                    ))}
                </TextField>
            </Grid>

            <Grid item xs={12} sm={2}>
                <TextField
                    select fullWidth label="Status"
                    value={status}
                    onChange={(e) => {
                        setStatus(e.target.value);
                        const newParams = new URLSearchParams(searchParams);
                        newParams.delete('mode');
                        newParams.delete('max_pending');
                        if(e.target.value) newParams.set('status', e.target.value);
                        else newParams.delete('status');
                        setSearchParams(newParams);
                    }}
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
            <Grid item xs={12} sm={2} sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" startIcon={<SearchIcon />} onClick={fetchRecords}>Buscar</Button>
                <Button variant="outlined" startIcon={<ClearIcon />} onClick={handleClear}>Limpar</Button>
            </Grid>
          </Grid>
        </Paper>

        {loading && <LinearProgress />}

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><b>Matrícula</b></TableCell>
                <TableCell><b>Aluno</b></TableCell>
                <TableCell><b>Curso</b></TableCell>
                <TableCell><b>Status</b></TableCell>
                <TableCell><b>Detalhe</b></TableCell>
                <TableCell align="center"><b>% Concluído</b></TableCell>
                <TableCell align="center"><b>Materias Obrigatórias Pendentes</b></TableCell>
                <TableCell align="center"><b>Ações</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((row) => {
                 const progress = row.total_hours > 0 ? (row.integralized_hours / row.total_hours) * 100 : 0;
                 const isRegular = row.status === 'Em regularidade';
                 return (
                  <TableRow key={row.ID} hover>
                    <TableCell>{row.student?.registration}</TableCell>
                    <TableCell>{row.student?.name}</TableCell>
                    <TableCell>{row.student?.course?.name}</TableCell>
                    <TableCell>
                        <Chip
                            label={row.status}
                            color={isRegular ? 'success' : 'warning'}
                            size="small"
                        />
                    </TableCell>
                    <TableCell sx={{maxWidth: 200, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                        {row.status_detail}
                    </TableCell>
                    <TableCell align="center">{progress.toFixed(1)}%</TableCell>
                    <TableCell align="center">{row.pending_obligatory}</TableCell>
                    <TableCell align="center">
                        <Tooltip title={isRegular ? 'Aluno em regularidade' : 'Registrar Ação'}>
                            <span>
                                <IconButton
                                    color="primary"
                                    disabled={isRegular}
                                    onClick={() => navigate(`/students/${row.student?.registration}/actions?semester_id=${selectedSemester}`)}
                                >
                                    <AssignmentIcon />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </TableCell>
                  </TableRow>
                 )
              })}
              {records.length === 0 && !loading && (
                  <TableRow><TableCell colSpan={8} align="center">Nenhum registro encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </Box>
  );
};

export default AcademicReport;
