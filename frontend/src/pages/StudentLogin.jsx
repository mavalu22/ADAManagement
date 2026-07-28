import { useState, useContext } from 'react';
import {
  Box, Button, Container, TextField, Typography, Paper, Alert, Link as MuiLink,
} from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const StudentLogin = () => {
  const [registration, setRegistration] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { loginStudent } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await loginStudent(registration.trim(), password);
      navigate('/aluno');
    } catch (err) {
      setError(err.response?.data?.error || 'Matrícula ou senha incorretos.');
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Container maxWidth="xs">
        <Paper elevation={0} sx={{ p: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Box component="img" src="/ufes-logo.png" alt="Logo UFES" sx={{ height: 52, mb: 3 }} />

          <Typography component="h1" variant="h5" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
            Área do Aluno
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Plano de Integralização (PAE/PIC)
          </Typography>

          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal" required fullWidth autoFocus
              label="Matrícula" name="registration"
              value={registration} onChange={(e) => setRegistration(e.target.value)}
            />
            <TextField
              margin="normal" required fullWidth
              name="password" label="Senha" type="password"
              autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3, mb: 1, py: 1.5 }}>
              Entrar
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Primeiro acesso?{' '}
            <MuiLink component={RouterLink} to="/aluno/cadastro">Criar conta</MuiLink>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            <MuiLink component={RouterLink} to="/">Sou da coordenação</MuiLink>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default StudentLogin;
