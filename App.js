import React, { Component } from 'react'; //Import de tous les éléments nécessaires
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  Image,
  Switch
} from 'react-native';

export class Flex extends React.Component {
  constructor(props) { //Définition de tous les states utilisés pour l'affichage dynamique de données sur l'écran
    super(props);
    this.state = {
      sessionID: '', //Notre ID de session
      ourMessages: [], //Array des messages que l'on envoie au bot
      botMessages: [], //Array des messages que l'on reçoit du bot
      isPwdVerified: false, //Le mot de passe a-t-il été donné?
      text: '', //Valeur par défaut du champ de texte
      switchEnabled: false, //Active ou non le thème clair ou sombre
    };
  }

  componentDidMount() {
    this._startSession(); //On lance la session au démarrage de l'app, et on affiche le message par défaut demande à l'utilisateur le mot de passe.
    let updated = this.state.botMessages.concat(
      'Veuillez saisir le mot de passe pour commencer.'
    );
    this.setState({ botMessages: updated });
  }

  render() {
    //On récupère de manière dynamique la liste de tous les messages émis et reçus afin de les ajouter sur l'app. On liste les messages dans l'ordre,
    //et on attribue un ID unique à chaque message en même temps. En fonction du thème sélectionné dans le switch, l'affichage du texte sera différent.

    let messagesDisplay = [];

    for (let i = 0; i < this.state.botMessages.length; i++) {
      messagesDisplay.push(
        <View key={i * 2 + 1} style={styles.outMessage}>
          <Text style={this.state.switchEnabled ? [styles.message, styles.messageDark] : [styles.message, styles.messageWhite]}>
            {this.state.botMessages[i]}
          </Text>
        </View>
      );

      if (this.state.ourMessages[i] !== undefined) { //On vérifie si l'on a bien un message de notre part, ce qui n'est pas forcément le cas
        messagesDisplay.push(
          <View key={i * 2} style={styles.inMessage}>
            <Text style={[styles.message, styles.messageBlue]}>
              {this.state.ourMessages[i]}
            </Text>
          </View>
        );
      }
    }

    return ( //On affiche l'ensemble de nos composants à l'écran.
      <View style={styles.container}>
        <ImageBackground source={require('./assets/background.jpg')} style={styles.image}>
          <View style={{ flex: 2 }} />
          <View style={styles.headerContainer}>
            <Text style={styles.nameContact}>Chatbot - IBMxJUNIA</Text>
            <Switch
              style={styles.themeSwitch}
              onValueChange={(switchEnabled)=>this.setState({switchEnabled})}
              value={this.state.switchEnabled}
              trackColor={{ false: "#767577", true: "#6699ff" }}
              thumbColor={this.state.switchEnabled ? "#292929" : "#fff"}
              ios_backgroundColor="#3e3e3e"
            />
          </View>
          <View style={styles.listMessage}>
            <ScrollView
              showsHorizontalScrollIndicator={false}
              ref={(ref) => {
                this.scrollView = ref;
              }}
              onContentSizeChange={() =>
                this.scrollView.scrollToEnd({ animated: true })
              }
              style={{ maxHeight: windowHeight * 0.72 }}>
              {messagesDisplay}
            </ScrollView>
          </View>
          <View style={styles.newMessage}>
            <TextInput
              value={this.state.text}
              placeholder="Mon message"
              placeholderTextColor="rgba(122,122,122,1)"
              inlineImagePadding={10}
              onSubmitEditing={this.onPress}
              selectionColor="rgba(122,122,122,1)"
              onChangeText={(text) => this.setState({ text: text })}
              style={styles.inputMessage}></TextInput>
            <View style={{ flex: 2 }}></View>
            <TouchableOpacity style={styles.sendMessage} onPress={this.onPress}>
              <Image
                source={require('./assets/send_white.png')}
                style={styles.sendIcon}
              />
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
    );
  }

  onPress = () => { //On vérifie l'appui du bouton d'envoi du message, sachant que l'on écoute déjà l'appui sur la touche "entrée" sur PC et téléphone.
    if (this.state.text !== '') {
      this._sendMessage(this.state.text);
      let updated = this.state.ourMessages.concat(this.state.text);
      this.setState({ ourMessages: updated });
      this.setState({ text: '' }); //Clear du champ de texte
    }
  };

  _sendMessage(reqTexta) {
    fetch( //On fait la requête vers le serveur du chatbot pour envoyer un message, puis on récupère le résultat que l'on envoie dans la fonction ci-dessous
      'https://nodejs-express-app-cxlkb-2020-11-30.eu-gb.mybluemix.net/ai/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'sessionId=' + this.state.sessionID + '&reqText=' + reqTexta,
      }
    )
      .then((response) => response.json())
      .then((data) => this._checkPwd(data));
  }

  _checkPwd(resp) {
    if (!this.state.isPwdVerified) { //Si le mot de passe n'a pas encore été vérifié, on vérifie s'il est correct!
      if (
        resp.response ==
        'Toutes mes félicitations! Vous avez trouvé la solution! Vous êtes vraiment très forts. Quel est le nom de votre équipe pour enregistrer votre résultat?'
      ) { //Manière un peu brute pour vérifier le résultat, mais ça reste le moyen le plus simple avec la structure de réponse du serveur
        this.setState({ isPwdVerified: true });
        this._sendMessage('TOKTOK'); //On met le state à true et en envoie TOKTOK, afin de pouvoir continuer la conversation ensuite: le bot continuerait de demander le nom d'équipe en boucle sinon.
      } else {
        let updated = this.state.botMessages.concat(
          'Mot de passe incorrect, désolé :-('
        );
        this.setState({ botMessages: updated }); //On affiche un "faux" message venant du bot, disant que le mot de passe est incorrect. Sinon, le bot répondrait sans avoir vérifié le mot de passe au préalable.
      }
    } else {
      let tmp_resp;

      if (
        resp.response == 'Votre équipe est déjà enregistré à la position 1!' //Si le mot de passe est validé, on affiche le message et on passe en conversation classique.
      ) {
        tmp_resp = 'Mot de passe validé, merci ! :-)';
      } else {
        tmp_resp = resp.response;
      }

      let updated = this.state.botMessages.concat(tmp_resp);
      this.setState({ botMessages: updated });
    }
  }

  _deleteSession() { //Permet de supprimer la session en cours, comme décrit dans la documentation
    let formData = new FormData();
    formData.append('sessionId', this.sessionID);
    fetch(
      'https://nodejs-express-app-cxlkb-2020-11-30.eu-gb.mybluemix.net/ai/session',
      { method: 'DELETE', body: formData }
    )
      .then((response) => response.json())
  }

  _startSession() { //Permet de lancer la session afin de récupérer le sessionId
    fetch(
      'https://nodejs-express-app-cxlkb-2020-11-30.eu-gb.mybluemix.net/ai/session',
      { method: 'GET' }
    )
      .then((response) => response.json())
      .then((data) => {
        this.setState({ sessionID: data.response }, () => {
          console.log('SESSION ID : ' + this.state.sessionID);
        });
      });
  }
}

//Ci-dessous, on définit le design de l'application. 
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,1)',
    flexDirection: 'column',
    flex: 1,
  },
  sendIcon:{
    flex: 1,
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  headerContainer:{
    flex: 2,
    flexDirection: "row",
    flexWrap:'wrap',
    justifyContent: 'center',
    alignItems: 'center'
  },
  nameContact: {
    flex: 50,
    fontWeight: 'bold',
    fontFamily: 'Calibri',
    fontSize: 18,
    textAlign: 'center',
    color: 'white',
  },
  themeSwitch:{
      flex: 10,
      maxWidth: 40,
      marginRight: 8
  },
  image: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  listMessage: {
    flex: 20,
    height: '80%',
  },
  inMessage: {
    flex: 1,
    alignItems: 'flex-end',
    width: windowWidth,
    textAlign: 'left',
  },
  outMessage: {
    flex: 1,
    alignItems: 'flex-start',
    width: windowWidth,
    textAlign: 'left',
  },
  message: {
    borderRadius: 10,
    fontFamily: 'Calibri',
    fontSize: 16,
    maxWidth: '80%',
    minWidth: '20%',
    padding: 8,
    margin: 5,
  },
  messageWhite: {
    backgroundColor: 'rgba(255, 255, 255,1)',
    color: 'rgba(25,25,25,1)',
  },
  messageDark: {
    backgroundColor: 'rgba(41,41,41,1)',
    color: 'white'
  },
  messageBlue: {
    backgroundColor: 'rgba(102, 153, 255,1)',
    color: 'rgba(255,255,255,1)',
  },
  newMessage: {
    flex: 3,
    flexDirection: 'row',
    margin: 5,
  },
  inputMessage: {
    flex: 50,
    backgroundColor: 'rgba(41,41,41,1)',
    borderRadius: 10,
    textAlign: 'center',
    color: 'rgba(122,122,122,1)',
  },
  sendMessage: {
    flex: 10,
    backgroundColor: 'rgba(41,41,41,1)',
    borderRadius: 10,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Flex;
