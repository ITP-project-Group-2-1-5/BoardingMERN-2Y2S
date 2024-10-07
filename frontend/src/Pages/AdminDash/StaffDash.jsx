import { useState, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { DataGrid } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { useNavigate } from 'react-router-dom';
import configs from '../../config.js';
import { exportToExcel } from '../../Services/Excel.js';
import SideBar from '../../Components/SideBar/SideBar';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import SearchIcon from '@mui/icons-material/Search';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ClearIcon from '@mui/icons-material/Clear';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';

// Modal styling
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: '#f5f5f5',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

// Button styling
const buttonStyle = {
  backgroundColor: '#000',
  color: '#fff',
  '&:hover': {
    backgroundColor: '#303f9f',
  },
};

const StaffDash = () => {
  const [post, setPost] = useState([]);
  const [post2, setPost2] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [availableStaff, setAvailableStaff] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const token = sessionStorage.getItem('token');

  useEffect(() => {
    fetchDetails();
    fetchDetails2();
    fetchAvailableStaff();
    const editBtn = false;
    const data = { editBtn };
    localStorage.setItem('staffAdmin', JSON.stringify(data));
  }, []);

  const fetchDetails = async () => {
    try {
      const response = await axios.get(`${configs.apiUrl}/staff/staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const postWithId = response.data.map((post, index) => ({
        id: index + 1,
        ...post,
      }));
      setPost(postWithId);
    } catch (error) {
      console.error('Error fetching post details:', error);
    }
  };
  const fetchDetails2 = async () => {
    try {
      const response = await axios.get(`${configs.apiUrl}/services/services`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filter to include only 'Repair' and 'Cleaning' services, with case-insensitive matching
      const filteredData = response.data.filter(
        (post) =>
          post.serviceType.toLowerCase() === 'repair' ||
          post.serviceType.toLowerCase() === 'cleaning'
      );

      // Add IDs to the filtered posts
      const postWithId = filteredData.map((post, index) => ({
        id: index + 1,
        ...post,
      }));

      setPost2(postWithId);
    } catch (error) {
      console.error('Error fetching post details:', error);
    }
  };

  const fetchAvailableStaff = async () => {
    try {
      const response = await axios.get(`${configs.apiUrl}/staff/staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvailableStaff(response.data);
    } catch (error) {
      console.error('Error fetching available staff:', error);
    }
  };

  const handleEdit = (row) => {
    const editBtn = true;
    const data = { row, editBtn };
    localStorage.setItem('staffAdmin', JSON.stringify(data));
    navigate('/addStaff');
  };

  const handleDelete = (id) => {
    axios
      .delete(`${configs.apiUrl}/staff/staff/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        fetchDetails();
      })
      .catch(() => {
        console.error('Error deleting staff');
      });
  };

  const handleOpen = (row) => {
    setSelectedService(row);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedStaff('');
    setError('');
  };

  const handleAssignStaff = async () => {
    if (!selectedStaff) {
      setError('Please select a staff member!');
      return;
    }

    const isStaffAlreadyAssigned = post2.some(
      (service) => service.allocatedStaff === selectedStaff
    );

    if (isStaffAlreadyAssigned) {
      const selectedStaffMember = availableStaff.find(
        (staff) => staff.newID === selectedStaff
      );
      setError(
        `Staff member ${selectedStaffMember.name} is already assigned to another service!`
      );
      return;
    }

    try {
      await axios.put(
        `${configs.apiUrl}/services/services/${selectedService._id}`,
        {
          ...selectedService,
          allocatedStaff: selectedStaff,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire('Staff assigned successfully!', '', 'success');
      setError('');
      fetchDetails2();
      handleClose();
    } catch (error) {
      setError('Error assigning staff');
    }
  };

  const columns = [
    { field: 'newID', headerName: 'ID', width: 100 },
    { field: 'name', headerName: 'Staff Name', width: 200 },
    { field: 'email', headerName: 'Email', width: 250 },
    { field: 'phone', headerName: 'Contact', width: 150 },
    { field: 'type', headerName: 'Staff Type', width: 150 },

    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) => (
        <div>
          <IconButton color="primary" onClick={() => handleEdit(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDelete(params.row._id)}
          >
            <DeleteIcon />
          </IconButton>
        </div>
      ),
    },
  ];

  const columns2 = [
    { field: '_id', headerName: 'ID', width: 100 },
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'serviceType', headerName: 'Service', width: 150 },
    {
      field: 'allocatedStaff',
      headerName: 'Staff',
      width: 150,
      renderCell: (params) => (
        <span>
          {params.value || 'No assigned staff'}{' '}
          {/* Display "No assigned staff" if empty */}
        </span>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <div>
          <IconButton color="primary" onClick={() => handleOpen(params.row)}>
            <EditIcon />
          </IconButton>
          {/* Only show the ClearIcon button if a staff member is assigned */}
          {params.row.allocatedStaff && (
            <IconButton
              color="error"
              onClick={() => handleRemoveStaff(params.row)}
            >
              <ClearIcon />
            </IconButton>
          )}
        </div>
      ),
    },
  ];

  const handleRemoveStaff = async (service) => {
    try {
      await axios.put(
        `${configs.apiUrl}/services/services/${service._id}`,
        {
          ...service,
          allocatedStaff: '', // Clear the assigned staff
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire('Staff removed successfully!', '', 'success');
      fetchDetails2(); // Refresh the service list
    } catch (error) {
      console.error('Error removing staff:', error);
      Swal.fire('Error removing staff!', '', 'error');
    }
  };

  const excelExport = () => {
    exportToExcel(post, 'StaffDetails.xlsx');
  };

  const pdfExport = () => {
    const doc = new jsPDF();

    // Add Company Logo
    const logoImg = new Image();
    logoImg.src = '/logo.jpg'; // Replace with the path to your logo image
    logoImg.onload = () => {
      // Resize the logo if necessary
      const logoWidth = 40; // Adjust as needed
      const logoHeight = (logoImg.height / logoImg.width) * logoWidth;

      // Calculate centered position
      const pageWidth = doc.internal.pageSize.getWidth();
      const logoX = (pageWidth - logoWidth) / 2; // Center the logo

      // Add a border on the first page
      addPageBorder(doc);

      // Add logo to the PDF
      doc.addImage(logoImg, 'PNG', logoX, 5, logoWidth, logoHeight);

      // Add Company Name
      doc.setFontSize(22);
      doc.setFont('times', 'bold'); // Use a professional font style
      const companyName = 'UniBodim-Finder';
      const companyNameX =
        (pageWidth -
          (doc.getStringUnitWidth(companyName) * doc.internal.getFontSize()) /
            2) /
        2;
      doc.text(companyName, companyNameX, logoHeight + 15); // Center company name below the logo

      // Add Report Generated Date
      doc.setFontSize(12); // Reset font size for further text
      const generatedDate = new Date().toLocaleDateString(); // Get current date
      doc.text(`Report Generated: ${generatedDate}`, 14, logoHeight + 25); // Position below the company name

      // Export Staff Details
      doc.text('Staff Details', 14, logoHeight + 40);
      doc.autoTable({
        head: [['ID', 'Staff Name', 'Email', 'Contact', 'Staff Type']],
        body: post
          .filter(
            (item) =>
              item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.type.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((item) => [
            item.newID,
            item.name,
            item.email,
            item.phone,
            item.type,
          ]),
        startY: logoHeight + 50,
        styles: {
          lineColor: [0, 0, 0], // Black color for the borders
          lineWidth: 0.5,
        },
        headStyles: {
          fillColor: [0, 51, 102], // Dark blue for the header background
          textColor: [255, 255, 255], // Optional: background color for the header
        },
        didDrawCell: (data) => {
          // Draw border for each cell
          doc.setDrawColor(0, 0, 0); // Black color for the border
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
        },
      });

      // Export Service Details
      doc.addPage();
      addPageBorder(doc); // Add border on the new page
      doc.text('Service Details', 14, 30);
      doc.autoTable({
        head: [['ID', 'Name', 'Service', 'Allocated Staff']],
        body: post2.map((item) => [
          item._id,
          item.name,
          item.serviceType,
          item.allocatedStaff || 'Not assigned',
        ]),
        startY: 40,
        styles: {
          lineColor: [0, 0, 0], // Black color for the borders
          lineWidth: 0.5,
        },
        headStyles: {
          fillColor: [0, 51, 102], // Dark blue for the header background
          textColor: [255, 255, 255], // Optional: background color for the header
        },
        didDrawCell: (data) => {
          // Draw border for each cell
          doc.setDrawColor(0, 0, 0); // Black color for the border
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
        },
      });

      doc.save('StaffAndServiceDetails.pdf');
    };

    // Optionally handle errors if the image fails to load
    logoImg.onerror = () => {
      console.error('Error loading logo image');
    };
  };

  // Function to add page border
  const addPageBorder = (doc) => {
    const margin = 10; // Margin from the page edges
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Draw the border
    doc.setDrawColor(0, 0, 0); // Black color for the border
    doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);
  };

  return (
    <div style={{ display: 'flex' }}>
      <SideBar />
      <div style={{ flexGrow: 1, padding: '20px' }}>
        <AppBar position="static" style={{ background: '#000' }}>
          <Toolbar>
            <Typography variant="h6" component="div" style={{ flexGrow: 1 }}>
              Staff Dashboard
            </Typography>
            <TextField
              placeholder="Search Staff..."
              variant="outlined"
              size="small"
              style={{
                marginRight: '10px',
                width: '250px',
                backgroundColor: '#fff',
                borderRadius: '4px', // Rounded corners
                transition: 'border-color 0.3s ease', // Smooth transition
              }}
              InputProps={{
                endAdornment: (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton>
                      <SearchIcon fontSize="small" /> {/* Smaller icon */}
                    </IconButton>
                    {/* Optional: Clear button */}
                    <IconButton onClick={() => setSearchTerm('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </div>
                ),
              }}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = '#3f51b5')} // Change border color on focus
              onBlur={(e) => (e.target.style.borderColor = '#ccc')} // Revert border color on blur
            />
            <Button
              variant="contained"
              startIcon={<SaveAltIcon />}
              style={buttonStyle}
              onClick={() => excelExport()}
            >
              Export Excel*
            </Button>
            <Button
              variant="contained"
              startIcon={<PictureAsPdfIcon />}
              style={buttonStyle}
              onClick={() => pdfExport()}
            >
              Export PDF
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAddAlt1Icon />} // Add User icon
              style={buttonStyle}
              href="/addStaff" // Call addUser function on click
            >
              Add User
            </Button>
          </Toolbar>
        </AppBar>
        <div style={{ height: 400, width: '100%', marginTop: '20px' }}>
          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            style={{ marginTop: '20px' }}
          >
            Staff List
          </Typography>
          <DataGrid
            rows={post.filter(
              (item) =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.type.toLowerCase().includes(searchTerm.toLowerCase())
            )}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5]}
            sx={{
              backgroundColor: '#ffffff',
              '& .MuiDataGrid-cell': {
                backgroundColor: '#f5f5f5',
                color: '#000',
                '&:hover': {
                  backgroundColor: '#e0e0e0',
                },
              },
              '& .MuiDataGrid-headerCell': {
                backgroundColor: '#e0e0e0',
                color: '#000',
              },
            }}
          />
        </div>
        <div style={{ height: 400, width: '100%', marginTop: '20px' }}>
          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            style={{ marginTop: '40px' }}
          >
            Services List
          </Typography>
          <DataGrid
            rows={post2}
            columns={columns2}
            pageSize={5}
            rowsPerPageOptions={[5]}
            sx={{
              backgroundColor: '#ffffff',
              '& .MuiDataGrid-cell': {
                backgroundColor: '#f5f5f5',
                color: '#000',
                '&:hover': {
                  backgroundColor: '#e0e0e0',
                },
              },
              '& .MuiDataGrid-headerCell': {
                backgroundColor: '#e0e0e0',
                color: '#000',
              },
            }}
          />
        </div>
        <Modal open={open} onClose={handleClose}>
          <Box sx={modalStyle}>
            <Typography variant="h6" component="h2" color={'black'}>
              Assign Staff to Service
            </Typography>
            <TextField
              select
              label="Select Staff"
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              fullWidth
              margin="normal"
              error={!!error}
              helperText={error}
            >
              {availableStaff.map((staff) => (
                <MenuItem key={staff.newID} value={staff.newID}>
                  {staff.name}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              onClick={handleAssignStaff}
              style={buttonStyle}
            >
              Assign Staff
            </Button>
          </Box>
        </Modal>
      </div>
    </div>
  );
};

export default StaffDash;
