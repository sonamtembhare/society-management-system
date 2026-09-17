import styles from "./Loader.module.css";

interface LoaderProps {
  message?: string;
}

export default function Loader({ message = "Loading..." }: LoaderProps) {
  return (
    <div className={styles.container}>
      <div className={styles.spinner} />
      <p className={styles.message}>{message}</p>
    </div>
  );
}
