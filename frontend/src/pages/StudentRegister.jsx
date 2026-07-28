import { useState, useContext } from 'react';
import {
  Box, Button, Container, TextField, Typography, Paper, Alert, Link as MuiLink,
} from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { toast } from 'react-toastify';

const StudentRegister = () => {
  const [registration, setRegistration] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const { loginStudent } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/student/register', { registration: registration.trim(), password });
      toast.success('Conta criada com sucesso!');
      // Entra automaticamente após o cadastro.
      await loginStudent(registration.trim(), password);
      navigate('/aluno');
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível criar a conta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="xs">
        <Paper elevation={0} sx={{ p: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Box component="img" src="/ufes-logo.png" alt="Logo UFES" sx={{ height: 52, mb: 3 }} />

          <Typography component="h1" variant="h5" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
            Criar conta
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Use sua matrícula e defina uma senha de acesso.
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
              name="password" label="Senha (mín. 6 caracteres)" type="password"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
            <TextField
              margin="normal" required fullWidth
              name="confirm" label="Confirmar senha" type="password"
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
            />
            <Button type="submit" fullWidth variant="contained" size="large" disabled={saving} sx={{ mt: 3, mb: 1, py: 1.5 }}>
              {saving ? 'Criando...' : 'Criar conta'}
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Já tem conta?{' '}
            <MuiLink component={RouterLink} to="/aluno/login">Entrar</MuiLink>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default StudentRegister;
