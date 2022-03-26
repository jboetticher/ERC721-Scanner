import {
  Grid,
  Card,
  CardContent
} from "@mui/material";
import "./background.css";

function App() {

  const addresses =
    ["0xD78B6EF907Fd09aBE22011C31267D47ec59f1c45",
      "0x4E060bf069d468f48a7BbB165e4DFf6CA88f6464",
      "0xfa8c726f34244c03E2eb3D67805Dc92B13a699d1"];

  return (
    <div className="App">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <h1>RECENT ERC721 CONTRACTS DEPLOYED ON ROPSTEN</h1>
        </Grid>
        {addresses.map((address, i) => (
          <Grid item md={4} sm={6} xs={12} key={i}>
            <Card>
              <CardContent>
                <h5>{address}</h5>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}

export default App;
