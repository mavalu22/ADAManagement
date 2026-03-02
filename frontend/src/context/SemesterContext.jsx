import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const SemesterContext = createContext();

export const SemesterProvider = ({ children }) => {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSemesterCode, setSelectedSemesterCode] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSemesters = async () => {
    try {
      const response = await api.get('/semesters');
      setSemesters(response.data);

      if (response.data.length > 0 && !selectedSemester) {
        setSelectedSemester(response.data[0].ID);
        setSelectedSemesterCode(response.data[0].code);
      }
    } catch (error) {
      console.error("Erro ao carregar semestres", error);
    } finally {
      setLoading(false);
    }
  };

  const changeSemester = (id) => {
    const sem = semesters.find(s => s.ID === id);
    if (sem) {
        setSelectedSemester(id);
        setSelectedSemesterCode(sem.code);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) fetchSemesters();
  }, []);

  return (
    <SemesterContext.Provider value={{
      semesters,
      selectedSemester,
      selectedSemesterCode,
      changeSemester,
      refreshSemesters: fetchSemesters,
      loading
    }}>
      {children}
    </SemesterContext.Provider>
  );
};
