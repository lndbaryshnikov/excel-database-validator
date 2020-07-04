# excel-database-validator
    Валидатор для баз данных в формате .xlsx

Для ознакомления и использования валидатор выложен на 
[GitHub Pages](https://lndbaryshnikov.github.io/excel-database-validator/).

Для развертывания данного проекта локально необходимо клонировать 
репозиторий и запустить команду "npm init" для установки необходимых
зависимостей. Все пакеты, использованные в данном проекте и их 
версии можно посмотреть в package.json.

Результатом является интерактивная страничка на GitHub Pages (ссылка 
приложена выше). 

Приложение предназначено для проверки столбцов с данными
на валидность. Предусмотрены следующие виды проверок:

* Проверка электронного адреса на валидность - Email errors
* Проверка номера телефона - Phone number errors
* Проверка адреса сайта - Site address errors
* Проверка на наличие только цифр в ячейке - Only numbers

Все вышеперчисленные проверки проверяют также на наличие пробелов 
(наличие пробелов в начале и конце считается ошибкой).
  
* Проверка на лишние пробелы -  Whitespaces

Также имеется ряд специфичных проверок, так как приложение
создавалось для конкретного задания:

* Проверка полного имени на повторения (требуется указать 2 
столбца - Имя и Фамилия) - совпадения полного имени считается 
за ошибку (диакритические знаки игнорируются при проверке) - 
FullName errors
* Функция пересчета неповторяющихся названий (считается 
количество ячеек с неповторяющимися значениями) - 
Count companies

Результат проверки выводится на экран, также имеется возможность по 
завершении обработки скачать логи с ошибками.
