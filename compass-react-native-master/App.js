import React, { Component } from "react";
import {
  Platform,
  StyleSheet,
  View,
  PermissionsAndroid,
  Text,
  Alert,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ImageBackground,
} from "react-native";
import { Grid, Col, Row } from "react-native-easy-grid";
import {
  magnetometer,
  SensorTypes,
  setUpdateIntervalForType,
} from "react-native-sensors";
import LPF from "lpf";

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

import Torch from "react-native-torch";

export async function request_camera_runtime_permission() {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: "ReactNativeCode Camera Permission",
        message: "ReactNativeCode App needs access to your Camera.",
      }
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      Alert.alert("Camera Permission Granted.");
    } else {
      Alert.alert("Camera Permission Not Granted");
    }
  } catch (err) {
    console.warn(err);
  }
}

const { height, width } = Dimensions.get("window");

export default class App extends Component {
  async componentDidMount() {
    await request_camera_runtime_permission();
  }

  on_Torch() {
    this.isState = true;
    Torch.switchState(true); // Turn ON the Torch.
  }

  off_Torch() {
    this.isState = false;
    Torch.switchState(false); // Turn OFF the Torch.
  }
  constructor() {
    super();
    this.state = {
      magnetometer: "0",
      isState: false,
    };
    LPF.init([]);
    LPF.smoothing = 0.2;
  }

  componentDidMount() {
    this._toggle();
  }

  componentWillUnmount() {
    this._unsubscribe();
  }

  _toggle = () => {
    if (this._subscription) {
      this._unsubscribe();
    } else {
      this._subscribe();
    }
  };

  _subscribe = async () => {
    setUpdateIntervalForType(SensorTypes.magnetometer, 16);
    this._subscription = magnetometer.subscribe(
      (sensorData) => this.setState({ magnetometer: this._angle(sensorData) }),
      (error) => console.log("The sensor is not available")
    );
  };

  _unsubscribe = () => {
    this._subscription && this._subscription.unsubscribe();
    this._subscription = null;
  };

  _angle = (magnetometer) => {
    let angle = 0;
    if (magnetometer) {
      let { x, y } = magnetometer;
      if (Math.atan2(y, x) >= 0) {
        angle = Math.atan2(y, x) * (180 / Math.PI);
      } else {
        angle = (Math.atan2(y, x) + 2 * Math.PI) * (180 / Math.PI);
      }
    }
    return Math.round(LPF.next(angle));
  };

  _direction = (degree) => {
    if (degree >= 22.5 && degree < 67.5) {
      return "NE";
    } else if (degree >= 67.5 && degree < 112.5) {
      return "E";
    } else if (degree >= 112.5 && degree < 157.5) {
      return "SE";
    } else if (degree >= 157.5 && degree < 202.5) {
      return "S";
    } else if (degree >= 202.5 && degree < 247.5) {
      return "SW";
    } else if (degree >= 247.5 && degree < 292.5) {
      return "W";
    } else if (degree >= 292.5 && degree < 337.5) {
      return "NW";
    } else {
      return "N";
    }
  };

  // Match the device top with pointer 0° degree. (By default 0° starts from the right of the device.)
  _degree = (magnetometer) => {
    return magnetometer - 90 >= 0 ? magnetometer - 90 : magnetometer + 271;
  };

  render() {
    return (
      <ImageBackground
        source={require("./assets/splash.png")}
        style={styles.container}
      >
        <View style={styles.topContainer}>
          <Row style={{ alignItems: "center" }} size={1}>
            <Col style={{ alignItems: "center" }}>
              <Text
                style={{
                  color: "#fff",
                  fontSize: height / 26,
                  fontWeight: "bold",
                }}
              >
                {this._direction(this._degree(this.state.magnetometer))}
              </Text>
            </Col>
          </Row>

          <Row style={{ alignItems: "center" }} size={0.1}>
            <Col style={{ alignItems: "center" }}>
              <View style={{ width: width, alignItems: "center", bottom: 0 }}>
                <Image
                  source={require("./assets/compass_pointer.png")}
                  style={{
                    height: height / 26,
                    resizeMode: "contain",
                  }}
                />
              </View>
            </Col>
          </Row>

          <Row style={{ alignItems: "center" }} size={2}>
            <Text
              style={{
                color: "#fff",
                fontSize: height / 27,
                width: width,
                position: "absolute",
                textAlign: "center",
              }}
            >
              {this._degree(this.state.magnetometer)}°
            </Text>

            <Col style={{ alignItems: "center" }}>
              <Image
                source={require("./assets/compass_bg.png")}
                style={{
                  height: width - 80,
                  justifyContent: "center",
                  alignItems: "center",
                  resizeMode: "contain",
                  transform: [
                    { rotate: 360 - this.state.magnetometer + "deg" },
                  ],
                }}
              />
            </Col>
          </Row>
        </View>
        <View style={styles.bottomContainer}>
          <View style={styles.MainContainer}>
            <TouchableOpacity
              onPress={
                this.isState
                  ? this.off_Torch.bind(this)
                  : this.on_Torch.bind(this)
              }
            >
              <Image
                style={styles.TextStyle}
                source={
                  this.isState
                    ? require("./assets/torch_on.png")
                    : require("./assets/torch_off.png")
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    );
  }
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black", resizeMode: "contain" },
  topContainer: { flex: 1, height: "60%" },
  bottomContainer: { flex: 1, height: "60%", alignItems: "center" },
  MainContainer: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 20 : 0,
    justifyContent: "center",
    margin: 20,
  },

  button: {
    backgroundColor: "white",
    borderRadius: 7,
    marginTop: 10,
  },

  TextStyle: {},
});
