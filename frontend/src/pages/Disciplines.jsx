import React, { useEffect, useState } from 'react';
import {
  Box, Container, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Tooltip,
  TextField, Button, Divider, LinearProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import Header from '../components/Header';
import api from '../services/api';
import { toast } from 'react-toastify';

const Disciplines = () => {
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(false);

  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');

  const fetchDisciplines = () => {
    setLoading(true);
    api.get('/disciplines')
      .then(res => setDisciplines(res.data || []))
      .catch(() => toast.error('Erro ao carregar disciplinas.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDisciplines();
  }, []);

  const handleCreate = async () => {
    if (!newCode.trim() || !newName.trim()) {
      toast.error('Código e nome são obrigatórios.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/disciplines', { code: newCode.trim(), name: newName.trim() });
      toast.success('Disciplina cadastrada com sucesso!');
      setNewCode('');
      setNewName('');
      fetchDisciplines();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao cadastrar disciplina.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (d) => {
    setEditingId(d.ID);
    setEditCode(d.code);
    setEditName(d.name);
  };

  const cancelEdit = () => setEditingId(null);

  const handleUpdate = async (id) => {
    if (!editCode.trim() || !editName.trim()) {
      toast.error('Código e nome são obrigatórios.');
      return;
    }
    try {
      await api.put(`/disciplines/${id}`, { code: editCode.trim(), name: editName.trim() });
      toast.success('Disciplina atualizada.');
      setEditingId(null);
      fetchDisciplines();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao atualizar disciplina.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja remover esta disciplina?')) return;
    try {
      await api.delete(`/disciplines/${id}`);
      toast.success('Disciplina removida.');
      fetchDisciplines();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao remover disciplina.');
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            Disciplinas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {disciplines.length} {disciplines.length === 1 ? 'disciplina cadastrada' : 'disciplinas cadastradas'}
          </Typography>
        </Box>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Cadastrar Nova Disciplina
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <TextField
              label="Código"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              size="small"
              sx={{ width: 160 }}
            />
            <TextField
              label="Nome"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 200 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Cadastrar'}
            </Button>
          </Box>
        </Paper>

        <Paper>
          {loading && <LinearProgress />}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 160 }}><b>Código</b></TableCell>
                  <TableCell><b>Nome</b></TableCell>
                  <TableCell align="center" sx={{ width: 100 }}><b>Ações</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {disciplines.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                      Nenhuma disciplina cadastrada.
                    </TableCell>
                  </TableRow>
                )}
                {disciplines.map((d) =>
                  editingId === d.ID ? (
                    <TableRow key={d.ID} sx={{ bgcolor: 'action.hover' }}>
                      <TableCell>
                        <TextField
                          value={editCode}
                          onChange={(e) => setEditCode(e.target.value)}
                          size="small"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          size="small"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Salvar">
                          <IconButton color="primary" onClick={() => handleUpdate(d.ID)}>
                            <SaveIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancelar">
                          <IconButton onClick={cancelEdit}>
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow key={d.ID} hover>
                      <TableCell>{d.code}</TableCell>
                      <TableCell>{d.name}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <IconButton color="primary" onClick={() => startEdit(d)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remover">
                          <IconButton color="error" onClick={() => handleDelete(d.ID)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </Box>
  );
};

export default Disciplines;
