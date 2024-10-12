import { useState, useEffect } from 'react';
import Navbar from '../../Components/NavBar/Navbar';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Container, FormControl, InputLabel, MenuItem, Select, TextField, Typography, Box, Button } from '@mui/material';
import axios from 'axios';
import configs from '../../config.js';
import { GoogleMap, LoadScript, Marker, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import * as XLSX from 'xlsx'; // Import xlsx library

const defaultTheme = createTheme();

const containerStyle = {
    width: '100%',
    height: '600px'
};

export default function Map() {
    const token = sessionStorage.getItem('token');
    const [data, setData] = useState([]);
    const [center, setCenter] = useState({ lat: 0, lng: 0 });
    const [currentLocation, setCurrentLocation] = useState('');
    const [destination, setDestination] = useState(null);
    const [directions, setDirections] = useState(null);
    const [distance, setDistance] = useState("");
    const [duration, setDuration] = useState("");
    const [selectedUni, setSelectedUni] = useState('All Universities');
    const [selectedLocationDetails, setSelectedLocationDetails] = useState(null); // State to hold boarding location details
    const uni = ['All Universities', 'SLIIT University', 'Japura University', 'Ruhuna University', 'Sabaragamu University', 'Horizon University', 'CINEC University', 'Jaffna University','Peradeniya University','Colombo University','Rajarata University'];

    const fetchDetails = async () => {
        try {
            const response = await axios.get(`${configs.apiUrl}/maps/maps`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setData(response.data);
            if (response.data.length > 0) {
                setCenter({
                    lat: response.data[0].lat,
                    lng: response.data[0].lng
                });
            }
        } catch (error) {
            console.error('Error fetching post details:', error);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, []);

    const handleDestinationClick = (location) => {
        setDestination({ lat: location.lat, lng: location.lng });
        setSelectedLocationDetails(location); // Set the selected location's details
    };

    const handleDirectionsCallback = (response) => {
        if (response !== null && response.status === 'OK') {
            setDirections(response);
            const route = response.routes[0];
            const leg = route.legs[0];
            setDistance(leg.distance.text);
            setDuration(leg.duration.text);
        } else {
            console.error('Error fetching directions:', response);
        }
    };

    const handleChange = (event) => {
        setSelectedUni(event.target.value);
    };

    const handleRefresh = () => {
        //  reset the map
        setCurrentLocation('');
        setDestination(null);
        setDirections(null);
        setDuration(null);
        setDistance(null);
        setCenter({ lat: 6.9271, lng: 79.8612 }); // Reset to default center
        setSelectedLocationDetails(null); // Clear selected boarding location details
    };

    const clearcurrentLocation = () => {
        // Clear the current location
        setCurrentLocation('');
        //setDestination(null);
        //setDirections(null);
        setDuration(null);
        setDistance(null);
        setCenter({ lat: 7.8064132, lng: 80.4593221}); // Reset to default center
       // setSelectedLocationDetails(null); // Clear selected boarding location details
    };




    const filteredAccommodations = selectedUni === 'All Universities'
        ? data
        : data.filter(post => post.area === selectedUni);

    // Function to generate Excel file
    const generateExcel = () => {
        const filteredData = selectedUni === 'All Universities'
            ? data
            : data.filter(location => location.area === selectedUni);

        // Create a worksheet
        const worksheet = XLSX.utils.json_to_sheet(filteredData.map(location => ({
            Name: location.name,
            Area: location.area,
            
            
        })));

        // Create a workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Boarding Locations');

        // Export the file
        XLSX.writeFile(workbook, `boarding_locations_${selectedUni}.xlsx`);
    };

    return (
        <ThemeProvider theme={defaultTheme}>
            <Navbar />
            <br />
            <br />
            <br />
            <Container>
                <FormControl variant="filled" margin="normal" sx={{ backgroundColor: 'white', width: '300px' }}>
                    <InputLabel>Select your University Area</InputLabel>
                    <Select
                        value={selectedUni}
                        onChange={handleChange}
                        label="University Area"
                    >
                        {uni.map(uni => (
                            <MenuItem key={uni} value={uni}>
                                {uni}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    label="Enter Your Current Location"
                    variant="outlined"
                    fullWidth
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    sx={{ backgroundColor: 'white' }}
                />

                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={clearcurrentLocation} 
                    sx={{ marginTop: '20px' }}
                >
                    Clear Current Location
                </Button>
                
                {/* Refresh Button */}
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleRefresh} 
                    sx={{ marginTop: '20px' ,marginLeft: '12px'}}
                >
                    Refresh Map
                </Button>

                {/* Generate Excel Button */}
                <Button 
                    variant="contained" 
                    color="secondary" 
                    onClick={generateExcel} 
                    sx={{ marginTop: '20px', marginLeft: '10px' }}
                >
                    Download University Area Boarding Details
                </Button>

                <br />
                <br />
                <LoadScript googleMapsApiKey="AIzaSyCm7hvevtn4RV1dWhaRAzdT7L19zJMoqPI">
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={center}
                        zoom={7}
                    >
                        {filteredAccommodations.map(location => (
                            <Marker
                                key={location._id}
                                position={{ lat: location.lat, lng: location.lng }}
                                onClick={() => handleDestinationClick(location)}
                                title={location.name}
                            />
                        ))}
                        {destination && currentLocation && (
                            <DirectionsService
                                options={{
                                    destination: destination, // Destination is the clicked boarding location
                                    origin: currentLocation,
                                    travelMode: 'DRIVING'
                                }}
                                callback={handleDirectionsCallback}
                            />
                        )}
                        {directions && (
                            <DirectionsRenderer
                                options={{
                                    directions: directions
                                }}
                            />
                        )}
                    </GoogleMap>
                </LoadScript>

                {/* Display Boarding Location Details */}
                {selectedLocationDetails && (
                    <Box sx={{ marginTop: '20px', backgroundColor: 'black', padding: '15px', borderRadius: '8px' }}>
                        <Typography variant="h6">Boarding Location Details</Typography>
                        <Typography variant="body1"><strong>Name:</strong> {selectedLocationDetails.name}</Typography>
                        <Typography variant="body1"><strong>University Area :</strong> {selectedLocationDetails.area}</Typography>
                        <Typography variant="body1"><strong>Current Location    :</strong> {currentLocation}</Typography>
                        <Typography variant="body1"><strong>Distance            :</strong> {distance}</Typography>
                        <Typography variant="body1"><strong>Time to Destination :</strong> {duration}</Typography>
                    </Box>
                )}
            </Container>
        </ThemeProvider>
    );
}
