import { useState, useEffect, React } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Grid,
  CssBaseline,
  TextField,
  Button,
} from "@material-ui/core";
import Chip from "@mui/material/Chip";
import Autocomplete from "@mui/material/Autocomplete";
import { makeStyles } from "@material-ui/core/styles";
import Stack from "@mui/material/Stack";
import { db } from "../../services/firebase";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { fetchList } from "../../services/fetchList";
import { Nav } from "../../components/Nav";
import Schedule from "./Schedule";

const useStyles = makeStyles((theme) => ({
  title: {
    [theme.breakpoints.down("sm")]: {
      fontSize: "25px",
    },
  },
  secondTitle: {
    marginTop: theme.spacing(10),
    textTransform: "uppercase",
    textAlign: "center",
  },
}));

export const Profile = ({ user }) => {
  const classes = useStyles();
  const [departmentLists, setDepartmentLists] = useState([]);
  const [expertise, setExpertises] = useState([]);

  const [name, setName] = useState(`${user.displayName}`);
  const [email, setEmail] = useState(`${user.email}`);
  const [department, setDepartment] = useState([]);
  const [exper, setExper] = useState([]);
  const [minor, setMinor] = useState([]);
  const [mid, setMId] = useState("");
  const [isProfessor, setProfessor] = useState(true);
  const [scheduleData, setScheduleData] = useState([]);
  const [remoteScheduleData, setRemoteScheduleData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  console.log("rendering schedule: scheduleData: ", scheduleData.length);
  console.log(scheduleData);
  console.log("remoteScheduleData: ", remoteScheduleData.length);
  console.log(remoteScheduleData);
  useEffect(() => {
    fetchList(
      db,
      "departments_list",
      "departments",
      "department",
      setDepartmentLists,
      (e) => {
        return { title: e };
      }
    );
    fetchList(
      db,
      "keywords_mock",
      "keywords",
      "keywords",
      setExpertises,
      (e) => {
        return { title: e };
      }
    );
  }, []);

  useEffect(() => {
    async function fetchUserData() {
      setIsLoading(true);
      const docRef = doc(db, "userProfile", `${user.uid}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setName(data.name);
        setEmail(data.email);
        setMId(data.mid);
        if (data.role === "professor") {
          setProfessor(true);
          setDepartment(data.department);
          setExper(data.expertise);
          if (data.scheduleData && data.scheduleData.length > 0) {
            const schedData = data.scheduleData.map((item) => {
              let mappedData = {};
              try {
                mappedData = {
                  Id: item.Id,
                  // Subject: item.Subject,
                  // IsAllDay: item.IsAllDay,
                };
                if (item.StartTime) {
                  mappedData.StartTime = item.StartTime.toDate();
                }
                if (item.EndTime) {
                  mappedData.EndTime = item.EndTime.toDate();
                }
              } catch (e) {
                console.log("Yikes, invalid schedule data." + e);
                mappedData = {};
              }
              return mappedData;
            });
            setRemoteScheduleData(schedData);
          }
        } else {
          setProfessor(false);
          setDepartment(data.majors);
          setMinor(data.minor);
        }
      }
      setIsLoading(false);
    }

    fetchUserData();
  }, [user.uid, isProfessor]);

  const localToRemote = (scheduleData) => {
    return scheduleData.map((item) => {
      let mappedData = {};
      try {
        mappedData = {
          Id: item.Id,
          // Subject: item.Subject,
          // IsAllDay: item.IsAllDay,
          StartTime: Timestamp.fromDate(item.StartTime),
          EndTime: Timestamp.fromDate(item.EndTime),
        };
      } catch (e) {
        console.log("Yikes, invalid schedule data." + e);
      }
      return mappedData;
    });
  };

  const handleForm = async (e) => {
    e.preventDefault();
    //console.log(scheduleData.length + ":" + remoteScheduleData.length);
    //console.log(scheduleData);
    //console.log(remoteScheduleData);
    isProfessor
      ? await setDoc(doc(db, "userProfile", `${user.uid}`), {
          name: name,
          email: email,
          department: department,
          expertise: exper,
          mid: mid,
          role: "professor",
          //scheduleData: localToRemote(remoteScheduleData),
        })
      : await setDoc(doc(db, "userProfile", `${user.uid}`), {
          name: name,
          email: email,
          majors: department,
          minor: minor,
          mid: mid,
          role: "student",
          // scheduleData: localToRemote(remoteScheduleData),
        });
  };

  const handleFormSchedule = async (e) => {
    e.preventDefault();
    console.log(scheduleData.length + ":" + remoteScheduleData.length);
    console.log(scheduleData);
    console.log(remoteScheduleData);
    isProfessor
      ? await setDoc(doc(db, "userProfile", `${user.uid}`), {
          scheduleData: localToRemote(remoteScheduleData),
        })
      : await setDoc(doc(db, "userProfile", `${user.uid}`), {
          //Student - Not needed
          // scheduleData: localToRemote(remoteScheduleData),
        });
  };

  if (isLoading) {
    return "";
  } else {
    return (
      <>
        <CssBaseline />
        <AppBar position="fixed">
          <Toolbar>
            <Typography variant="h4" className={classes.title}>
              Welcome to Our Office Hours!
            </Typography>
          </Toolbar>
        </AppBar>

        <Grid container>
          <Grid item xs={2}>
            <Nav />
          </Grid>

          <Grid item xs={1}></Grid>

          <Grid item xs={4}>
            <Grid container direction="column" alignItems="center"></Grid>
            <Stack spacing={4} sx={{ width: 400 }}>
              <Toolbar>
                {isProfessor ? (
                  <Typography variant="h5" className={classes.secondTitle}>
                    Professor Registration
                  </Typography>
                ) : (
                  <Typography variant="h5" className={classes.secondTitle}>
                    Student Registration
                  </Typography>
                )}
              </Toolbar>

              <TextField
                className={classes.name}
                label="Name"
                variant="standard"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <TextField
                className={classes.email}
                label="Email"
                variant="standard"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Autocomplete
                multiple
                id="tags-filled"
                options={departmentLists.map((option) => option.title)}
                freeSolo
                onChange={(event, value) => setDepartment(value)}
                value={department}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="filled"
                    label={isProfessor ? "Select Department" : "Select Major"}
                    placeholder={isProfessor ? "Departments" : "Majors"}
                  />
                )}
              />
              {isProfessor ? (
                <Autocomplete
                  multiple
                  id="tags-filled"
                  options={expertise.map((option) => option.title)}
                  value={exper}
                  freeSolo
                  onChange={(event, value) => setExper(value)}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="filled"
                      label="Areas of Expertise"
                      placeholder="Expertises"
                    />
                  )}
                />
              ) : (
                <Autocomplete
                  multiple
                  id="tags-filled"
                  options={departmentLists.map((option) => option.title)}
                  onChange={(event, value) => setMinor(value)}
                  value={minor}
                  freeSolo
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="filled"
                      label="Select Minor"
                      placeholder="Minors"
                    />
                  )}
                />
              )}
              <TextField
                className={classes.link}
                label={isProfessor ? "Meeting Link" : "ID#"}
                variant="standard"
                value={mid}
                onChange={(e) => setMId(e.target.value)}
              />
              {!isProfessor && (
                <Button
                  color="primary"
                  variant="contained"
                  onClick={handleForm}
                  disabled={!email || !name || !department || !minor || !mid}
                >
                  Save
                </Button>
              )}
            </Stack>
          </Grid>
          {isProfessor ? (
            <Grid item xs={3}>
              <Stack spacing={5} sx={{ width: 400 }}>
                <Typography variant="h5" className={classes.secondTitle}>
                  Select Availability
                </Typography>
                <Schedule
                  scheduleData={scheduleData}
                  setScheduleData={setScheduleData}
                  remoteScheduleData={remoteScheduleData}
                  setRemoteScheduleData={setRemoteScheduleData}
                  onBlur = {handleFormSchedule}
                ></Schedule>
                <Button
                  fullWidth
                  className={classes.continueButton}
                  color="primary"
                  variant="contained"
                  onClick={handleForm}
                  disabled={!email || !name || !department || !exper || !mid}
                >
                  Save
                </Button>
              </Stack>
            </Grid>
          ) : (
            <> </>
          )}
        </Grid>
      </>
    );
  }
};
