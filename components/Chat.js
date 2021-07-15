// imported react and react-native components
import React from 'react';
import { View, Text } from 'react-native';
import { GiftedChat, Bubble, InputToolbar } from 'react-native-gifted-chat';
import { Platform, KeyboardAvoidingView } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from '@react-native-community/netinfo';

// import Firestore to store data in database
const firebase = require('firebase');
require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBmfd2GQTer0fjTqbfIjz7OTZxvt-YcEvg",
  authDomain: "chatapp-a91bb.firebaseapp.com",
  projectId: "chatapp-a91bb",
  storageBucket: "chatapp-a91bb.appspot.com",
  messagingSenderId: "548450133327",
  appId: "1:548450133327:web:15ffc54bf255be795a113a",
  measurementId: "G-WRG36DN160"
};

export default class Chat extends React.Component{

  constructor(){
    super();
  
    this.state = {
      messages: [],
      uid: 0,
      user: {
        _id: '',
        name: '',
        avatar: '',
      },
      isConnected: false,
    }

  // Initialize Firebase
  if (!firebase.apps.length){
    firebase.initializeApp(firebaseConfig);
    }
  this.referenceChatMessages = firebase.firestore().collection('messages');
  }
  
  async getMessages() {
    let messages = '';
    try {
      messages = (await AsyncStorage.getItem('messages')) || [];
      this.setState({
        messages: JSON.parse(messages),
      });
    } catch (error) {
      console.log(error.message);
    }
  }

  async saveMessages() {
    try {
      await AsyncStorage.setItem(
        'messages',
        JSON.stringify(this.state.messages)
      );
    } catch (error) {
      console.log(error.message);
    }
  }

  async deleteMessages() {
    try {
      await AsyncStorage.removeItem('messages');
      this.setState({
        messages: [],
      });
    } catch (error) {
      console.log(error.message);
    }
  }

   // add messages to state and database
 addMessage(){
  const message = this.state.messages[0];

  this.referenceChatMessages.add({
    _id: message._id,
    text: message.text || null,
    createdAt: message.createdAt,
    user: message.user,
  })
}



  componentDidMount(){
    this.getMessages();

    let name = this.props.route.params.name;
    this.props.navigation.setOptions({ title: name });
     
        NetInfo.fetch().then((connection) => {
      if (connection.isConnected) {
        this.setState({
          isConnected: true,
        });

        this.referenceChatMessages = firebase
          .firestore()
          .collection('messages');
        this.authUnsubscribe = firebase
          .auth()
          .onAuthStateChanged(async (user) => {
            if (!user) {
              await firebase.auth().signInAnonymously();
            }

            
      this.setState({
        uid: user.uid,
        messages: [],
        user:{
          _id: user.uid,
          name: user.name,
          avatar: "https://placeimg.com/158/158/any"
        },
              messages: [],
            });
            this.unsubscribe = this.referenceChatMessages
              .orderBy('createdAt', 'desc')
              .onSnapShot(this.onCollectionUpdate);
          });
      } else {
        this.setState({
          isConnected: false,
        });
        this.getMessages();
      }
    });
  }

  componentWillUnmount() {
    this.authUnsubscribe();
 
  }

  onCollectionUpdate = (querySnapshot) => {
    const messages = [];
    // go through each document
    querySnapshot.forEach((doc) => {
      // get the QueryDocumentSnapshot's data
      let data = doc.data();
      messages.push({
        _id: data._id,
        text: data.text,
        createdAt: data.createdAt.toDate(),
        user: data.user,
      });
    });
    this.setState({
      messages,
    })
  }

  addMessage() {
    const message = this.state.messages[0];
    this.referenceChatMessages.add({
      _id: message._id,
      uid: this.state.uid,
      text: message.text || '',
      createdAt: message.createdAt,
      user: message.user,
    });
  }


  /* function called when user sends a message  */
  onSend(messages = []) {
    this.setState(previousState => ({
      messages: GiftedChat.append(previousState.messages, messages),
    }),
      () => {
        this.addMessage();
        this.saveMessages();
      }
    );
  }
  /* function to change bubble style  */
  renderBubble(props) {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#000'
          }
        }}
      />
    )
  }

  renderInputToolbar(props) {
    if (this.state.isConnected === false) {
    } else {
      return <InputToolbar {...props} />;
    }
  }

  render() {
    let color = this.props.route.params.color;


    return (
      <View style={{ flex: 1, backgroundColor: color, height: '100%' }}>
        <GiftedChat
          /* renders Bubble  */
          renderBubble={this.renderBubble.bind(this)}
          renderInputToolbar={this.renderInputToolbar.bind(this)}
          messages={this.state.messages}
          isConnected={this.state.isConnected}
          onSend={(messages) => this.onSend(messages)}
          user={this.state.user}
        />
        {/* prevents keyboard to overlap input field on Android devices  */}
        { Platform.OS === 'android' ? <KeyboardAvoidingView behavior="height" /> : null
 }
      </View>
    )
  }
}