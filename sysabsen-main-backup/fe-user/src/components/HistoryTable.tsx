import { useMemo } from 'react';
import { Box } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useKioskStore } from '../store/useKioskStore';
import { formatTapTime } from '../utils/time';

const columns: GridColDef[] = [
  { field: 'name', headerName: 'Nama', flex: 1, minWidth: 160 },
  { field: 'nim', headerName: 'ID', width: 140 },
  { field: 'course', headerName: 'Jabatan', flex: 1, minWidth: 180 },
  { field: 'device', headerName: 'Device', width: 160 },
  {
    field: 'tapTime',
    headerName: 'Waktu',
    width: 260,
    valueGetter: ({ value }) => formatTapTime(String(value))
  },
  {
    field: 'type',
    headerName: 'Status',
    width: 120,
    valueFormatter: ({ value }) => String(value ?? '').toUpperCase()
  }
];

export function HistoryTable() {
  const rows = useKioskStore((state) => state.history);
  const normalized = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        tapTime: row.tapTime
      })),
    [rows]
  );

  return (
    <Box sx={{ height: 360, width: '100%' }}>
      <DataGrid
        rows={normalized}
        columns={columns}
        getRowId={(row) => row.id}
        hideFooter
        disableColumnMenu
        disableRowSelectionOnClick
        density="compact"
        sx={{
          bgcolor: 'background.paper',
          borderColor: 'divider',
          '& .MuiDataGrid-columnHeaders': {
            color: 'text.primary'
          },
          '& .MuiDataGrid-cell': {
            color: 'text.primary'
          },
          '& .MuiDataGrid-row:nth-of-type(odd)': {
            bgcolor: 'action.hover'
          }
        }}
      />
    </Box>
  );
}

export default HistoryTable;
