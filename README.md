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

Регулярные выражения для проверок можно посмотреть по адресу
_src/ValidatorModel.private/validators.ts_.

Результат проверки выводится на экран, также имеется возможность по 
завершении обработки скачать логи с ошибками. 

Архитектура приложения построена на принципах MVP-архитектуры 
с Passive View.

Приложение разделено на три слоя - Model, View и Presenter:

1. Модель содержит только бизнес-логику и не производит 
никаких расчетов, связанных с отображением.
2. Вид управляет только отображением.
Реагирует на действия пользователя, но обработкой 
пользовательских событий занимается исключительно Представитель.
3. Представитель - отдельный слой для обновления модели и 
отображения. Представитель подписывается на оповещения Модели и Вида
и занимается обработкой этих оповещений.

Представитель служит связующим звеном и позволяет сделать Модель и Вид
независимыми друг от друга. В данном приложении представитель 
зависим от Модели и Вида, но не наоборот. Для ослаблении зависимости 
Представителя от других слоев реализован паттерн Наблюдатель 
(Observer). Наблюдатель позволяет слоям легко подписываться на 
изменения и оповещать о них.
