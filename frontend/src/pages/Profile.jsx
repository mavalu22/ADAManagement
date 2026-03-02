import React, { useState, useContext, useEffect } from 'react';
import { Box, Button, Container, TextField, Typography, Paper, Grid } from '@mui/material';
import api from '../services/api';
import Header from '../components/Header';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    if (user) {
        setFormData({ name: user.name, email: user.email, password: '' });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userId = user.id || user.ID || user.user_id;

      const payload = { ...formData };
      if (payload.password === '') delete payload.password;

      const response = await api.put(`/users/${userId}`, payload);

      toast.success('Perfil atualizado com sucesso!');

      const updatedUser = { ...user, ...response.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar perfil.');
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="sm" sx={{ mt: 5 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" color="primary" fontWeight="bold" mb={3}>
            Meu Perfil
          </Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Nome" name="name"
                  value={formData.name} onChange={handleChange} variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="E-mail" name="email" type="email"
                  value={formData.email} onChange={handleChange} variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Nova Senha (deixe em branco para manter)" name="password" type="password"
                  value={formData.password} onChange={handleChange} variant="outlined"
                />
              </Grid>
            </Grid>
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 3 }}>
              Salvar Alterações
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Profile;
