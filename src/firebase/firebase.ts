import { FirebaseError, initializeApp } from "firebase/app";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const db = getFirestore(app);

async function addData(date: string) {
  await setDoc(doc(db, "graphData", date), {
    gross_sales: new Array(24).fill(0),
    returning_customer_rate: new Array(24).fill(0),
    orders_fulfilled: new Array(24).fill(0),
    orders: new Array(24).fill(0),
		total_sales_over_time: new Array(24).fill(0),
		conversion_rate_over_time: new Array(24).fill(0),
		average_order_value_over_time: new Array(24).fill(0),
  });
}

type dataReturnType = {
  gross_sales?: { time: string; value: number }[];
  returning_customer_rate?: { time: string; value: number }[];
  orders_fulfilled?: { time: string; value: number }[];
  orders?: { time: string; value: number }[];
	total_sales_over_time?: { time: string; value: number }[];
	conversion_rate_over_time?: { time: string; value: number }[];
	average_order_value_over_time?: { time: string; value: number }[];
};

async function getData(date: string) {
  var result: dataReturnType = {};
  await getDocs(collection(db, "graphData")).then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      if (doc.id === date) {
        result = doc.data();
      }
    });
  });
  return result;
}

export async function fetchData(date: string): Promise<any> {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);

    const docRef = doc(db, "graphData", date);
    const docSnap = await getDoc(docRef);

    let result;
    if (docSnap.exists()) {
      // If the document exists, fetch the data
      result = await getData(date);
    } else {
      // If the document does not exist, add the data and then fetch it
      await addData(date);
      result = await getData(date);
    }

    return result;
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error getting document:", e);
    }
    throw e;
  }
}

export function updateDateData(date: string, data: dataReturnType) {
	setDoc(doc(db, "graphData", date), data);
}