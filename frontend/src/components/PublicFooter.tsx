export default function PublicFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <p>&copy; {new Date().getFullYear()} Lion Climate. Все права защищены.</p>
        <p>Продажа и установка кондиционеров в Москве и Московской области.</p>
      </div>
    </footer>
  );
}
