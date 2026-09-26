import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Employee, Task, UserAccount, WeeklyReport, AppNotification, TaskActivityLog } from './types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with database ID specified in config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Validate connection to Firestore as per requirements
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Error Handling Infrastructure
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// REALTIME SUBSCRIBERS

export function subscribeToTasks(callback: (tasks: Task[]) => void): () => void {
  const path = 'tasks';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Task[] = snapshot.docs.map((d) => d.data() as Task);
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToEmployees(callback: (employees: Employee[]) => void): () => void {
  const path = 'employees';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Employee[] = snapshot.docs.map((d) => d.data() as Employee);
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToUserAccounts(callback: (accounts: UserAccount[]) => void): () => void {
  const path = 'userAccounts';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: UserAccount[] = snapshot.docs.map((d) => d.data() as UserAccount);
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToWeeklyReports(callback: (reports: WeeklyReport[]) => void): () => void {
  const path = 'weeklyReports';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: WeeklyReport[] = snapshot.docs.map((d) => d.data() as WeeklyReport);
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToNotifications(callback: (notifications: AppNotification[]) => void): () => void {
  const path = 'notifications';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: AppNotification[] = snapshot.docs.map((d) => d.data() as AppNotification);
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToActivityLogs(callback: (logs: TaskActivityLog[]) => void): () => void {
  const path = 'activityLogs';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: TaskActivityLog[] = snapshot.docs.map((d) => d.data() as TaskActivityLog);
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// SANITIZE DATA FOR FIRESTORE (Firestore rejects undefined values)
export function cleanForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanForFirestore) as unknown as T;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = typeof value === 'object' && value !== null ? cleanForFirestore(value) : value;
    }
  }
  return cleaned as T;
}

// FIRESTORE CRUD OPERATIONS

export async function saveTaskToFirestore(task: Task): Promise<void> {
  const path = `tasks/${task.id}`;
  try {
    await setDoc(doc(db, 'tasks', task.id), cleanForFirestore(task), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTaskFromFirestore(taskId: string): Promise<void> {
  const path = `tasks/${taskId}`;
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveEmployeeToFirestore(employee: Employee): Promise<void> {
  const path = `employees/${employee.id}`;
  try {
    await setDoc(doc(db, 'employees', employee.id), cleanForFirestore(employee), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteEmployeeFromFirestore(employeeId: string): Promise<void> {
  const path = `employees/${employeeId}`;
  try {
    await deleteDoc(doc(db, 'employees', employeeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveUserAccountToFirestore(account: UserAccount): Promise<void> {
  const path = `userAccounts/${account.id}`;
  try {
    await setDoc(doc(db, 'userAccounts', account.id), cleanForFirestore(account), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserAccountFromFirestore(accountId: string): Promise<void> {
  const path = `userAccounts/${accountId}`;
  try {
    await deleteDoc(doc(db, 'userAccounts', accountId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveWeeklyReportToFirestore(report: WeeklyReport): Promise<void> {
  const path = `weeklyReports/${report.id}`;
  try {
    await setDoc(doc(db, 'weeklyReports', report.id), cleanForFirestore(report), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveNotificationToFirestore(notif: AppNotification): Promise<void> {
  const path = `notifications/${notif.id}`;
  try {
    await setDoc(doc(db, 'notifications', notif.id), cleanForFirestore(notif), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function markNotificationAsReadInFirestore(notifId: string): Promise<void> {
  const path = `notifications/${notifId}`;
  try {
    await updateDoc(doc(db, 'notifications', notifId), { read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function markAllNotificationsAsReadInFirestore(notifs: AppNotification[]): Promise<void> {
  try {
    const unread = notifs.filter((n) => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach((n) => {
      batch.update(doc(db, 'notifications', n.id), { read: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'notifications/batch');
  }
}

export async function deleteNotificationFromFirestore(notifId: string): Promise<void> {
  const path = `notifications/${notifId}`;
  try {
    await deleteDoc(doc(db, 'notifications', notifId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveActivityLogToFirestore(log: TaskActivityLog): Promise<void> {
  const path = `activityLogs/${log.id}`;
  try {
    await setDoc(doc(db, 'activityLogs', log.id), cleanForFirestore(log), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// RESET FIRESTORE DATA
export async function clearFirestoreCollections(defaultAdmin: UserAccount): Promise<void> {
  try {
    const collectionsToClear = ['tasks', 'employees', 'weeklyReports', 'userAccounts'];
    for (const collName of collectionsToClear) {
      const snapshot = await getDocs(collection(db, collName));
      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }
    // Re-insert default admin
    await saveUserAccountToFirestore(defaultAdmin);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'clearAll');
  }
}

// SEED DEFAULT ADMIN IF EMPTY
export async function ensureDefaultAdmin(defaultAdmin: UserAccount): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, 'userAccounts'));
    if (snapshot.empty) {
      await saveUserAccountToFirestore(defaultAdmin);
    }
  } catch (error) {
    console.error('Error checking default admin in Firestore:', error);
  }
}
