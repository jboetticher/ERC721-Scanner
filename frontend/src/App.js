import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Link
} from "@mui/material";
import "./background.css";
import { useState } from "react";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { purple } from '@mui/material/colors';

function App() {

  const theme = createTheme({
    palette: {
      primary: {
        main: purple[300],
      }
    }
  });

  const [addresses, setAddresses] = useState(null);
  if (addresses == null) {
    setAddresses(-1);
    fetch("http://localhost:3001/geterc721")
      .then(res => res.json())
      .then(res => {
        setAddresses(res);
      });
  }
  const addressesFound = addresses !== null && addresses !== -1;

  return (
    <div className="App">
      <ThemeProvider theme={theme} >
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <h1>RECENT ERC721 CONTRACTS DEPLOYED ON ROPSTEN</h1>
          </Grid>
          {addressesFound ?
            addresses.map((address, i) => (
              <ERC721Card address={address} key={i} />
            )) :
            <Grid item xs={12}>
              <CircularProgress />
            </Grid>}
          <Grid item xs={12}>
            {addressesFound ?
              <Button variant="contained" onClick={() => { setAddresses(null) }}>
                Refresh
              </Button> : <></>
            }
          </Grid>
        </Grid>
      </ThemeProvider>
    </div>
  );
}

let ERC721Card = ({ address }) => {

  return (
    <Grid item md={4} sm={6} xs={12}>
      <Card>
        <CardContent>
          <h5>{address}</h5>
        </CardContent>
        <CardActions>
          <Button>
            <Link underline="none" target="_blank"
              href={`https://ropsten.etherscan.io/address/${address}`}>
              Look on Etherscan
            </Link>
          </Button>
        </CardActions>
      </Card>
    </Grid>
  );
}

export default App;
