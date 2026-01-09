import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Localization from 'expo-localization'; // مكتبة تحديد اللغة
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';

const { width } = Dimensions.get('window');

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const TRANSLATIONS = {
  ar: {
    home: 'الرئيسية', stats: 'التحليلات', settings: 'الإعدادات', myTasks: 'مهامي اليوم',
    newTask: 'مهمة جديدة', addTask: 'حفظ وجدولة', cancel: 'إلغاء',
    placeholder: 'ماذا تريد أن تنجز؟', empty: 'لا توجد مهام.. أضف واحدة!',
    completed: 'مكتملة', pending: 'قيد الانتظار', chart: 'أداؤك هذا الأسبوع ممتاز!',
    darkMode: 'الوضع الليلي', language: 'اللغة / Language', about: 'حول التطبيق',
    reset: 'تصفير التطبيق', resetConfirm: 'هل أنت متأكد من حذف كل البيانات؟',
    welcome: 'أهلاً بك', guest: 'مستخدم محلي',
    setReminder: 'تحديد وقت التذكير:',
    labels: { d: 'يوم', h: 'ساعة', m: 'دقيقة', s: 'ثانية' },
    alertSet: 'تم الضبط!', alertBody: 'سيصلك إشعار بعد مرور الوقت المحدد: '
  },
  en: {
    home: 'Home', stats: 'Analytics', settings: 'Settings', myTasks: 'My Daily Tasks',
    newTask: 'New Task', addTask: 'Save & Schedule', cancel: 'Cancel',
    placeholder: 'What do you want to do?', empty: 'No tasks yet.. Add one!',
    completed: 'Completed', pending: 'Pending', chart: 'Great performance this week!',
    darkMode: 'Dark Mode', language: 'Language / اللغة', about: 'About App',
    reset: 'Reset App', resetConfirm: 'Are you sure you want to delete all data?',
    welcome: 'Welcome', guest: 'Local User',
    setReminder: 'Set Reminder Duration:',
    labels: { d: 'Day', h: 'Hr', m: 'Min', s: 'Sec' },
    alertSet: 'Reminder Set!', alertBody: 'Notification scheduled after: '
  }
};

export default function App() {
  let [fontsLoaded] = useFonts({
    Cairo_400Regular,
    Cairo_700Bold,
    Poppins_400Regular,
    Poppins_700Bold,
  });

  // --- كشف لغة الجهاز تلقائياً ---
  // نتحقق إذا كان كود لغة الجهاز يبدأ بـ 'ar'
  const systemLanguage = Localization.getLocales()[0].languageCode === 'ar' ? 'ar' : 'en';

  const [currentTab, setCurrentTab] = useState('Home'); 
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [lang, setLang] = useState(systemLanguage); // البداية حسب لغة الجهاز
  const [showSplash, setShowSplash] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [daysInput, setDaysInput] = useState('');
  const [hoursInput, setHoursInput] = useState('');
  const [minutesInput, setMinutesInput] = useState('');
  const [secondsInput, setSecondsInput] = useState('');

  const [tasks, setTasks] = useState([
    { id: '1', title: 'التطبيق يعمل بلغة جهازك', completed: false, time: 'Auto Lang' },
  ]);

  const theme = {
    bg: isDarkMode ? '#121212' : '#f5f6fa',
    card: isDarkMode ? '#1e1e1e' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#2f3542',
    textSub: isDarkMode ? '#aaaaaa' : '#a4b0be',
    primary: '#575fcf',
    menuBg: isDarkMode ? '#000000' : '#1e272e',
    navBorder: isDarkMode ? '#333' : '#eee',
    inputBg: isDarkMode ? '#333' : '#f1f2f6',
    fontRegular: lang === 'ar' ? 'Cairo_400Regular' : 'Poppins_400Regular',
    fontBold: lang === 'ar' ? 'Cairo_700Bold' : 'Poppins_700Bold',
  };

  const t = TRANSLATIONS[lang];
  const offsetValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const splashOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (fontsLoaded) {
      setTimeout(() => {
        Animated.timing(splashOpacity, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => setShowSplash(false));
      }, 2000);
    }
    registerForPushNotificationsAsync();
  }, [fontsLoaded]);

  async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      if (existingStatus !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    }
  }

  async function scheduleNotification(title, totalSeconds) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ " + t.alertSet,
        body: t.alertBody + title,
        sound: true,
      },
      trigger: { seconds: totalSeconds },
    });
  }

  const toggleDrawer = () => {
    Animated.parallel([
      Animated.timing(scaleValue, { toValue: isDrawerOpen ? 1 : 0.88, duration: 300, useNativeDriver: true }),
      Animated.timing(offsetValue, { toValue: isDrawerOpen ? 0 : (lang === 'ar' ? -230 : 230), duration: 300, useNativeDriver: true })
    ]).start();
    setIsDrawerOpen(!isDrawerOpen);
  };

  const addTask = async () => {
    if (newTaskTitle.trim().length === 0) return;
    
    const d = parseInt(daysInput) || 0;
    const h = parseInt(hoursInput) || 0;
    const m = parseInt(minutesInput) || 0;
    const s = parseInt(secondsInput) || 0;

    const totalSeconds = (d * 86400) + (h * 3600) + (m * 60) + s;
    const hasReminder = totalSeconds > 0;

    let timeString = '';
    if (hasReminder) {
      if (d > 0) timeString += `${d}${t.labels.d} `;
      if (h > 0) timeString += `${h}${t.labels.h} `;
      if (m > 0) timeString += `${m}${t.labels.m} `;
      if (s > 0) timeString += `${s}${t.labels.s}`;
    }

    setTasks([{ 
      id: Date.now().toString(), 
      title: newTaskTitle, 
      completed: false,
      time: timeString.trim()
    }, ...tasks]);
    
    if (hasReminder) {
      await scheduleNotification(newTaskTitle, totalSeconds);
      Alert.alert(t.alertSet, `${t.alertBody} \n${timeString}`);
    }
    
    setNewTaskTitle('');
    setDaysInput(''); setHoursInput(''); setMinutesInput(''); setSecondsInput('');
    setModalVisible(false);
  };

  const toggleComplete = (id) => setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  const deleteTask = (id) => setTasks(tasks.filter(task => task.id !== id));
  const resetApp = () => {
    Alert.alert(t.reset, t.resetConfirm, [
      { text: t.cancel, style: "cancel" },
      { text: "OK", onPress: () => setTasks([]), style: "destructive" }
    ]);
  };

  // --- دوال العرض ---
  const renderHome = () => (
    <View style={{flex: 1}}>
      <Text style={[styles.screenHeader, { color: theme.text, fontFamily: theme.fontBold, textAlign: lang === 'ar' ? 'right' : 'left' }]}>{t.myTasks}</Text>
      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        contentContainerStyle={{paddingBottom: 100}}
        renderItem={({ item }) => (
          <View style={[styles.taskItem, { backgroundColor: theme.card }]}>
            <TouchableOpacity onPress={() => toggleComplete(item.id)}>
              <Ionicons name={item.completed ? "checkbox" : "square-outline"} size={24} color={item.completed ? '#0be881' : theme.textSub} />
            </TouchableOpacity>
            
            <View style={{flex: 1, marginHorizontal: 10}}>
               <Text style={[styles.taskTitle, { color: theme.text, fontFamily: theme.fontRegular, textAlign: lang === 'ar' ? 'right' : 'left' }, item.completed && {textDecorationLine: 'line-through', color: theme.textSub}]}>
                {item.title}
              </Text>
              {item.time ? (
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: lang === 'ar' ? 'flex-end' : 'flex-start', marginTop: 5}}>
                  <Ionicons name="timer-outline" size={14} color={theme.primary} />
                  <Text style={{color: theme.primary, fontFamily: theme.fontRegular, fontSize: 12, marginLeft: 4}}>{item.time}</Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity onPress={() => deleteTask(item.id)}>
              <Ionicons name="trash-outline" size={20} color="#ff5e57" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<View style={styles.emptyState}><Ionicons name="leaf-outline" size={50} color={theme.textSub} /><Text style={{color: theme.textSub, marginTop: 10, fontFamily: theme.fontRegular}}>{t.empty}</Text></View>}
      />
      <TouchableOpacity style={[styles.fab, {backgroundColor: theme.primary}]} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => {
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.length - completed;
    return (
      <View style={{flex: 1}}>
        <Text style={[styles.screenHeader, { color: theme.text, fontFamily: theme.fontBold, textAlign: lang === 'ar' ? 'right' : 'left' }]}>{t.stats}</Text>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <View style={[styles.statCard, {backgroundColor: '#0be881'}]}>
             <Text style={[styles.statNumber, {fontFamily: theme.fontBold}]}>{completed}</Text>
             <Text style={[styles.statLabel, {fontFamily: theme.fontRegular}]}>{t.completed}</Text>
          </View>
          <View style={[styles.statCard, {backgroundColor: '#ff5e57'}]}>
             <Text style={[styles.statNumber, {fontFamily: theme.fontBold}]}>{pending}</Text>
             <Text style={[styles.statLabel, {fontFamily: theme.fontRegular}]}>{t.pending}</Text>
          </View>
        </View>
        <View style={[styles.chartPlaceholder, {backgroundColor: theme.card}]}>
          <Ionicons name="bar-chart" size={80} color={theme.primary} />
          <Text style={{marginTop: 15, color: theme.textSub, fontFamily: theme.fontRegular}}>{t.chart}</Text>
        </View>
      </View>
    );
  };

  const renderSettings = () => (
    <ScrollView style={{flex: 1}}>
      <Text style={[styles.screenHeader, { color: theme.text, fontFamily: theme.fontBold, textAlign: lang === 'ar' ? 'right' : 'left' }]}>{t.settings}</Text>
      <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}><Ionicons name="moon-outline" size={22} color={theme.text} /><Text style={[styles.settingText, { color: theme.text, fontFamily: theme.fontRegular }]}>{t.darkMode}</Text></View>
        <Switch value={isDarkMode} onValueChange={setIsDarkMode} trackColor={{false: "#767577", true: theme.primary}} />
      </View>
      <TouchableOpacity style={[styles.settingRow, { backgroundColor: theme.card }]} onPress={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}><Ionicons name="globe-outline" size={22} color={theme.text} /><Text style={[styles.settingText, { color: theme.text, fontFamily: theme.fontRegular }]}>{t.language}</Text></View>
        <Text style={{color: theme.primary, fontFamily: theme.fontBold}}>{lang.toUpperCase()}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.settingRow, { backgroundColor: theme.card }]} onPress={() => Alert.alert(t.about, "Version 1.0.0 Pro")}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}><Ionicons name="information-circle-outline" size={22} color={theme.text} /><Text style={[styles.settingText, { color: theme.text, fontFamily: theme.fontRegular }]}>{t.about}</Text></View>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.settingRow, { backgroundColor: theme.card, marginTop: 20 }]} onPress={resetApp}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}><Ionicons name="trash-bin-outline" size={22} color="#ff5e57" /><Text style={[styles.settingText, { color: "#ff5e57", fontFamily: theme.fontRegular }]}>{t.reset}</Text></View>
      </TouchableOpacity>
    </ScrollView>
  );

  if (!fontsLoaded || showSplash) {
    return (
      <Animated.View style={[styles.splashScreen, {opacity: splashOpacity}]}>
        <StatusBar hidden />
        <Ionicons name="rocket" size={80} color="#FFF" />
        <Text style={{fontSize: 28, color: '#FFF', fontWeight: 'bold', marginTop: 20}}>ProTasker</Text>
      </Animated.View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.menuBg}]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* Drawer */}
      <View style={[
        styles.drawerContainer, 
        { 
          alignItems: lang === 'ar' ? 'flex-end' : 'flex-start',
          left: lang === 'ar' ? undefined : 0, 
          right: lang === 'ar' ? 0 : undefined 
        }
      ]}>
        
        <View style={[styles.profileSection, { alignItems: lang === 'ar' ? 'flex-end' : 'flex-start' }]}>
          <View style={[styles.avatar, {backgroundColor: theme.primary}]}><Ionicons name="person" size={30} color="#FFF" /></View>
          <Text style={{color: '#FFF', fontSize: 18, fontFamily: theme.fontBold}}>{t.welcome}</Text>
          <Text style={{color: '#a4b0be', fontFamily: theme.fontRegular}}>{t.guest}</Text>
        </View>

        <View style={{width: '100%', marginTop: 20}}>
          {[{ id: 'Home', icon: 'home-outline', label: t.home }, { id: 'Stats', icon: 'pie-chart-outline', label: t.stats }, { id: 'Settings', icon: 'settings-outline', label: t.settings }].map((menu) => (
            <TouchableOpacity key={menu.id} style={[styles.drawerBtn, { flexDirection: lang === 'ar' ? 'row-reverse' : 'row' }]} onPress={() => { setCurrentTab(menu.id); toggleDrawer(); }}>
              <Ionicons name={menu.icon} size={22} color="#FFF" />
              <Text style={{color: '#FFF', fontSize: 16, fontFamily: theme.fontRegular, marginHorizontal: 15}}>{menu.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Main Screen */}
      <Animated.View style={[styles.mainScreen, { backgroundColor: theme.bg, transform: [{ scale: scaleValue }, { translateX: offsetValue }], borderRadius: isDrawerOpen ? 25 : 0 }]}>
        
        {/* Header */}
        <View style={[styles.topHeader, { backgroundColor: theme.card, flexDirection: lang === 'ar' ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity onPress={toggleDrawer}><Ionicons name={isDrawerOpen ? "close" : "menu"} size={28} color={theme.text} /></TouchableOpacity>
          <Text style={{fontSize: 18, fontFamily: theme.fontBold, color: theme.text}}>{currentTab === 'Home' ? t.home : currentTab === 'Stats' ? t.stats : t.settings}</Text>
          <View style={{width: 28}} /> 
        </View>

        {/* Content */}
        <View style={{flex: 1, padding: 20}}>
          {currentTab === 'Home' && renderHome()}
          {currentTab === 'Stats' && renderStats()}
          {currentTab === 'Settings' && renderSettings()}
        </View>

        {/* Bottom Nav */}
        <View style={[styles.bottomNav, { backgroundColor: theme.card, borderTopColor: theme.navBorder, flexDirection: lang === 'ar' ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentTab('Home')}>
            <Ionicons name={currentTab === 'Home' ? "home" : "home-outline"} size={24} color={currentTab === 'Home' ? theme.primary : theme.textSub} />
            <Text style={[styles.navText, { fontFamily: theme.fontRegular, color: currentTab === 'Home' ? theme.primary : theme.textSub }]}>{t.home}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentTab('Stats')}>
            <Ionicons name={currentTab === 'Stats' ? "pie-chart" : "pie-chart-outline"} size={24} color={currentTab === 'Stats' ? theme.primary : theme.textSub} />
            <Text style={[styles.navText, { fontFamily: theme.fontRegular, color: currentTab === 'Stats' ? theme.primary : theme.textSub }]}>{t.stats}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentTab('Settings')}>
            <Ionicons name={currentTab === 'Settings' ? "settings" : "settings-outline"} size={24} color={currentTab === 'Settings' ? theme.primary : theme.textSub} />
            <Text style={[styles.navText, { fontFamily: theme.fontRegular, color: currentTab === 'Settings' ? theme.primary : theme.textSub }]}>{t.settings}</Text>
          </TouchableOpacity>
        </View>

        {isDrawerOpen && <TouchableOpacity style={styles.overlay} onPress={toggleDrawer} />}
      </Animated.View>

      {/* Modal - Add Task */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: theme.card, width: '90%'}]}>
            <Text style={[styles.modalTitle, {color: theme.text, fontFamily: theme.fontBold}]}>{t.newTask}</Text>
            
            <TextInput 
              style={[styles.input, {backgroundColor: theme.inputBg, color: theme.text, fontFamily: theme.fontRegular, textAlign: lang === 'ar' ? 'right' : 'left'}]} 
              placeholder={t.placeholder} 
              placeholderTextColor={theme.textSub} 
              value={newTaskTitle} 
              onChangeText={setNewTaskTitle} 
            />

            <Text style={{alignSelf: lang === 'ar' ? 'flex-end' : 'flex-start', color: theme.textSub, marginBottom: 8, fontSize: 14, fontFamily: theme.fontRegular}}>
              {t.setReminder}
            </Text>
            
            <View style={{flexDirection: lang === 'ar' ? 'row-reverse' : 'row', justifyContent: 'space-between', marginBottom: 20}}>
              {/* Days */}
              <View style={styles.timeInputContainer}>
                <TextInput 
                  style={[styles.smallInput, {backgroundColor: theme.inputBg, color: theme.text, fontFamily: theme.fontBold}]}
                  placeholder="0" placeholderTextColor={theme.textSub} keyboardType="numeric" maxLength={2}
                  value={daysInput} onChangeText={setDaysInput}
                />
                <Text style={{color: theme.text, fontSize: 10, fontFamily: theme.fontRegular}}>{t.labels.d}</Text>
              </View>

              {/* Hours */}
              <View style={styles.timeInputContainer}>
                <TextInput 
                  style={[styles.smallInput, {backgroundColor: theme.inputBg, color: theme.text, fontFamily: theme.fontBold}]}
                  placeholder="0" placeholderTextColor={theme.textSub} keyboardType="numeric" maxLength={2}
                  value={hoursInput} onChangeText={setHoursInput}
                />
                <Text style={{color: theme.text, fontSize: 10, fontFamily: theme.fontRegular}}>{t.labels.h}</Text>
              </View>

              {/* Minutes */}
              <View style={styles.timeInputContainer}>
                <TextInput 
                  style={[styles.smallInput, {backgroundColor: theme.inputBg, color: theme.text, fontFamily: theme.fontBold}]}
                  placeholder="0" placeholderTextColor={theme.textSub} keyboardType="numeric" maxLength={2}
                  value={minutesInput} onChangeText={setMinutesInput}
                />
                <Text style={{color: theme.text, fontSize: 10, fontFamily: theme.fontRegular}}>{t.labels.m}</Text>
              </View>

              {/* Seconds */}
              <View style={styles.timeInputContainer}>
                <TextInput 
                  style={[styles.smallInput, {backgroundColor: theme.inputBg, color: theme.text, fontFamily: theme.fontBold}]}
                  placeholder="0" placeholderTextColor={theme.textSub} keyboardType="numeric" maxLength={2}
                  value={secondsInput} onChangeText={setSecondsInput}
                />
                <Text style={{color: theme.text, fontSize: 10, fontFamily: theme.fontRegular}}>{t.labels.s}</Text>
              </View>
            </View>

            <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%'}}>
              <TouchableOpacity style={[styles.modalBtn, {borderColor: theme.textSub, borderWidth: 1}]} onPress={() => setModalVisible(false)}><Text style={{color: theme.textSub, fontFamily: theme.fontRegular}}>{t.cancel}</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, {backgroundColor: theme.primary}]} onPress={addTask}><Text style={styles.btnTextFilled}>{t.addTask}</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  splashScreen: { ...StyleSheet.absoluteFillObject, backgroundColor: '#575fcf', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  drawerContainer: { 
    flex: 1, 
    paddingTop: 60, 
    paddingHorizontal: 20, 
    position: 'absolute', 
    top: 0, 
    bottom: 0, 
    width: width * 0.7, 
    zIndex: 1 
  },
  profileSection: { marginBottom: 30, width: '100%' },
  avatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  drawerBtn: { paddingVertical: 15, alignItems: 'center' },
  mainScreen: { flex: 1, position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 2, shadowColor: "#000", shadowOffset: { width: -5, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 20, overflow: 'hidden' },
  topHeader: { justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, paddingBottom: 15, elevation: 2 },
  screenHeader: { fontSize: 24, marginBottom: 20 },
  taskItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 1 },
  taskTitle: { fontSize: 16 },
  emptyState: { alignItems: 'center', marginTop: 50 },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  statCard: { width: '48%', padding: 20, borderRadius: 15, alignItems: 'center' },
  statNumber: { fontSize: 30, color: '#FFF' },
  statLabel: { color: '#FFF', fontSize: 14 },
  chartPlaceholder: { marginTop: 20, padding: 30, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 10 },
  settingText: { fontSize: 16, marginLeft: 10 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { padding: 20, borderRadius: 20, alignItems: 'center', width: '90%' },
  modalTitle: { fontSize: 20, marginBottom: 15 },
  input: { width: '100%', padding: 15, borderRadius: 10, marginBottom: 20 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', marginHorizontal: 5 },
  btnTextFilled: { color: '#FFF', fontFamily: 'Cairo_700Bold' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent', zIndex: 100 },
  bottomNav: { paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 20 : 10, borderTopWidth: 1, justifyContent: 'space-around', elevation: 10 },
  navItem: { alignItems: 'center', flex: 1 },
  navText: { fontSize: 10, marginTop: 4 },
  timeInputContainer: { alignItems: 'center', width: '22%' },
  smallInput: { width: '100%', height: 50, borderRadius: 10, textAlign: 'center', fontSize: 18, marginBottom: 5 }
});
