import { useEffect, useState, useContext, useRef } from 'react';
import {
  Box, Container, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress, Grid, TextField,
  MenuItem, Button, IconButton, Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import TimelineIcon from '@mui/icons-material/Timeline';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import api from '../../services/api';
import { SemesterContext } from '../../context/SemesterContext';

const StudentsReport = () => {
  const navigate = useNavigate();
  const { selectedSemester, selectedSemesterCode } = useContext(SemesterContext);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const registrationRef = useRef(null);
  const nameRef = useRef(null);
  const entryYearRef = useRef(null);

  const [quotaType, setQuotaType] = useState('');

  const fetchStudents = () => {
    if (!selectedSemester) return;

    setLoading(true);
    const params = new URLSearchParams();

    params.append('semester_id', selectedSemester);

    if (registrationRef.current?.value) params.append('registration', registrationRef.current.value);
    if (nameRef.current?.value) params.append('name', nameRef.current.value);
    if (entryYearRef.current?.value) params.append('entry_year', entryYearRef.current.value);

    if (quotaType) params.append('quota_type', quotaType);

    api.get(`/reports/students?${params.toString()}`)
       .then(res => setStudents(res.data))
       .catch(err => console.error(err))
       .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedSemester]);

  const handleClear = () => {
    if(registrationRef.current) registrationRef.current.value = '';
    if(nameRef.current) nameRef.current.value = '';
    if(entryYearRef.current) entryYearRef.current.value = '';

    setQuotaType('');
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4 }}>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            Alunos Ativos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {students.length} {students.length === 1 ? 'aluno' : 'alunos'} · {selectedSemesterCode}
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
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Nome" inputRef={nameRef} size="small" />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField fullWidth label="Ano" type="number" inputRef={entryYearRef} size="small" defaultValue={new Date().getFullYear()} />
            </Grid>
            <Grid item xs={6} sm={2}>
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
              <Button variant="contained" startIcon={<SearchIcon />} onClick={fetchStudents}>Buscar</Button>
              <Button variant="outlined" startIcon={<ClearIcon />} onClick={handleClear}>Limpar</Button>
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
              {students.length > 0 ? (
                students.map((s) => (
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
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

export default StudentsReport;
