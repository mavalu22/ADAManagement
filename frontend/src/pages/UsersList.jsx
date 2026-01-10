import React, { useEffect, useState, useContext, useRef } from 'react';
import { 
  Box, Container, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Chip, Switch, Tooltip,
  Grid, TextField, MenuItem, Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import Header from '../components/Header';
import api from '../services/api';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const { user: currentUser } = useContext(AuthContext);
  
  // Refs para Textos
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  
  // State para Select
  const [role, setRole] = useState('');

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      
      if (nameRef.current?.value) params.append('name', nameRef.current.value);
      if (emailRef.current?.value) params.append('email', emailRef.current.value);
      
      if (role) params.append('role', role);

      const response = await api.get(`/users?${params.toString()}`);
      setUsers(response.data);
    } catch (error) {
      toast.error('Erro ao carregar usuários.');
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClear = () => {
    if (nameRef.current) nameRef.current.value = '';
    if (emailRef.current) emailRef.current.value = '';
    
    setRole(''); // Reseta visualmente
  };

  // Funções de ação (delete, toggle) permanecem iguais...
  const handleDelete = async (id) => { /* ... */ };
  const handleToggleAdmin = async (targetUser) => { /* ... */ };
  const isOwnProfile = (targetUserId) => { /* ... */ };
  const getActionStatus = (u) => { /* ... */ };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 5 }}>
        <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
          <Typography variant="h5" color="primary" fontWeight="bold" mb={3}>
            Gerenciamento de Usuários
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Nome" inputRef={nameRef} size="small" />
            </Grid>
            <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Email" inputRef={emailRef} size="small" />
            </Grid>
            <Grid item xs={12} sm={2}>
                <TextField 
                    select fullWidth label="Permissão" 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)} 
                    size="small"
                >
                    <MenuItem value="">Todas</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="user">Usuário</MenuItem>
                </TextField>
            </Grid>
            <Grid item xs={12} sm={2} sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={fetchUsers}><SearchIcon/></Button>
                <Button variant="outlined" onClick={handleClear}><ClearIcon/></Button>
            </Grid>
          </Grid>
        </Paper>
          
        {/* Tabela permanece igual... */}
        <Paper elevation={3}>
            <TableContainer>
                <Table>
                    {/* ... cabeçalho ... */}
                    <TableHead>
                        <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Nome</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Permissão</TableCell>
                        <TableCell align="right">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((u) => {
                            // ... lógica do map ...
                             const status = { disabled: false, text: "" }; // Simplificado para exemplo, mantenha sua lógica original
                             if (u.ID === 1) { status.disabled = true; status.text = "Admin intocável"; }
                             
                            return (
                                <TableRow key={u.ID}>
                                    <TableCell>{u.ID}</TableCell>
                                    <TableCell>{u.name}</TableCell>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell>
                                    <Chip 
                                        label={u.role === 'admin' ? "Administrador" : "Usuário"} 
                                        color={u.role === 'admin' ? "primary" : "default"}
                                        size="small"
                                    />
                                    </TableCell>
                                    <TableCell align="right">
                                       {/* Botões... mantenha os originais */}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
      </Container>
    </Box>
  );
};

export default UsersList;