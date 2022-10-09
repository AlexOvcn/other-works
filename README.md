# Что это?
### Это библиотека для взаимодействия с базой данных. Представляет из себя удобный интерфейс для получения необходимых данных из базы данных MySQL.
***
# Какие задачи решает?
1) Сокращение размера кода.
2) Улучшение читаемости.
3) Защита от SQL инъекций.
4) Быстродействие при нагрузке с помощью Connection Pooling.
***
# Как установить?
### Загрузить и вставить папку `modelExtension` в папку `node_modules`.
> Для работы этой библиотеки должна иметься библиотека MySQL, для ее установки используем следующую команду.

        npm i mysql
***
# Как использовать?

> Будут содержаться элементы TypeScript, если вы используете обычный js, просто удалите их.
1) Импортируем создание пула из MySQL и класс `ModelExtension` из modelExtension.

        import { createPool } from "mysql";
        import { ModelExtension } from 'modelExtension';

2) Настраиваем создание пула.

        const pool = createPool({
            connectionLimit : ... Лимит одновременных подключений к бд ... ,
            host            : ... Название хоста ... ,
            user            : ... Имя пользователя бд ... ,
            password        : ... Пароль пользователя бд ... ,
            database        : ... Название базы данных ...
        });

3) Создаем модель, расширяя свой класс модели от импортируемого класса `ModelExtension`.

        class ModelCity extends ModelExtension {
            protected options = {
                // открытый пул соединений, обязателен, позволяет выполнить запрос
                open_pool_connections: Pool
                // выбор таблицы в которой будут осуществляться действия
                table: 'city'
            };
        }

4) Вызываем методы из созданной модели согласно правилам MySQL запросов. Каждый метод возвращает контекст класса, кроме метода execute, это означает, что методы можно комбинировать, вызывая их друг за другом через точку. Что касается метода execute, он тоже находится в контексте класса, но он всегда должен стоять в конце цепочки методов, именно он выполняет сформированный всеми методами до него запрос, этот метод возвращает промис с результатом запроса или ошибкой.

        new ModelCity().select('Name').where('ID', '=', 1).execute().then(res => console.log(res));


***
# Список существующих методов:

* select -> Метод для выбора возвращаемых полей в результирующей выборке.

* join -> Метод для выборки данных из нескольких таблиц, результат складывается в результирующий набор.

* where -> Метод для сортировки по значению в указанном поле.

* groupBy -> Метод для группировки значений в столбцах.

* orderBy -> Метод для выстраивания значений таблицы в определенном порядке.

* limit -> Метод для лимитирования результата выборки.

* insertValues -> Метод для вставки данных в бд. (!!!Количество вводимых значений должно быть кратно количеству выбранных столбцов)

* updateSet -> Метод для 'частичного' обновления данных в таблице бд (если обновляемая строка не найдена - новая не создается).

* replaceValues -> Метод для полного обновления данных в таблице бд, если какое-то поле не указали при выборе изменяемых полей, то значение в этих полях сбросится к значению по умолчанию либо появится ошибка при ограниченях в бд для определенных полей (если обновляемая строка не найдена - создается новая). (!!!Количество вводимых значений должно быть кратно количеству выбранных столбцов)

* delete -> Метод для удаления данных. !!Работает в таблице, которая была указана в модели

* ownQuery -> Метод для создания собственного запроса, с его помощью можно выполнить более сложный и специфичный запрос

***
# Примеры использования методов:
> Все запросы проводились на тестовой базе данных world от MySQL
1) Выбор строки с помощью select
    * Выбор строки с одним условием where

            new ModelCity().select('Name').where('ID', '=', 1).execute().then(res => console.log(res));

    * Выбор строки с двумя условиями where

            new ModelCity().select('Name').where('CountryCode', '=', 'AFG', 'AND', 'Population', '<', 237500).execute().then(res => console.log(res));

    * Выбор строки с тремя условиями where

            new ModelCity().select('*').where('ID', '<', '20', 'AND', 'CountryCode', '=', 'AFG', 'OR', 'ID', '=', 15).execute().then(res => console.log(res));

    * Выбор строки с использованием limit и показом восьми записей

            new ModelCity().select('ID', 'Name').limit(8).execute().then(res => console.log(res));

    * Выбор строки с использованием limit с пропуском 2ух записей в начале и с одним условием where

            new ModelCity().select('ID', 'Name').where('CountryCode', '=', 'RUS').limit(8, 2).execute().then(res => console.log(res));

    * Выбор строки с использованием orderBy и limit, показ деталей запроса в execute

            new ModelCity().select('*').orderBy(['Population'], 'ASC').limit(3).execute(true).then(res => console.log(res));

    * Выбор строки с использованием groupBy

            new ModelCountry().select('Continent').groupBy('Continent').execute(true).then(res => console.log(res));

    * Обьединение таблиц с помощью join, уточнение для поля в select
    
            new ModelCity().select(['country', 'Name']).join('INNER', ['country'], 'ID', '=', ['country', 'Capital'], 'OR' ,['city', 'ID'], '=', 'Capital', 'OR', ['city', 'ID'], '=', ['country', 'Capital']).where('Continent', '=', 'North America').limit(1).execute(true).then(res => console.log(res));

2) Вставка значений с помощью insertValues, во втором аргументе каждый массив в массиве это отдельная изменяемая строка в бд

        new ModelCity().insertValues(['ID', 'Name', 'CountryCode', 'District', 'Population'], [[10000, 'Lopuhinka', 'RUS', 'Lopuhinka (village)', 2000000], [10001, 'Nikolaevka', 'RUS', 'Nikolaevka (village)', 1]]).execute().then(res => console.log(res));

3) Обновление значений с помощью updateSet
    * Обновление без условий, третий аргумент указывает какую операцию мы производим с текущим значением в бд, то есть &#8219;Population&#8219; = &#8219;Population&#8219; * 1.1

            new ModelCity().updateSet(['Population'], [1.1], ['*']).execute().then(res => console.log(res));

    * Обновление с применением where, конечно мы можем просто присвоить новое значение, тогда пишем null, это эквивалетно &#8219;Name&#8219; = 'Kuganavolok'

            new ModelCity().updateSet(['Name', 'Population'], ['Kuganavolok', 30000], [null, '+']).where('ID', '=', 1).execute().then(res => console.log(res));

4) Обновление значений с помощью replaceValues, второй аргумент построен как в методе insertValues

        new ModelCity().replaceValues(['ID', 'Name', 'CountryCode'], [[1, 'Kuganavolok', 'RUS'], [2, 'Lyubavichi', 'RUS']]).execute(true).then(res => console.log(res));

5) Удаление данных с помощью delete

        new ModelCity().delete().where('ID', '=', 10001, 'OR', 'ID', '=', 10000).execute(true).then(res => console.log(res));

6) Создание самописного запроса с помощью ownQuery
    > Итоговый запрос к БД: SELECT &#8219;CountryCode&#8219;, sum(&#8219;Population&#8219;) as CountPopul FROM &#8219;city&#8219; GROUP BY &#8219;CountryCode&#8219; HAVING &#8219;CountPopul&#8219; > 40000000;

            class Model extends ModelExtension {
                protected options = {
                    open_pool_connections: connection
                };
            }

            let strQuery = 'SELECT ??, sum(??) as CountPopul FROM ?? GROUP BY ?? HAVING ?? > ?';

            let values = ['CountryCode', 'Population', 'city', 'CountryCode', `CountPopul`, 40000000];
            
            new Model().ownQuery(strQuery, values).execute().then(res => console.log(res));

***
# Обработка ошибок:
### Вышеприведенные примеры не имели конструкции для отлова ошибок, поэтому давайте рассмотрим следующие примеры. Это уже что касаемо промиса.

1) Первый пример

        new ModelCity().select('Name').where('ID', '=', 1).execute().then(
            res => console.log(res),
            error => {

                //* ошибка MySQL
                if (typeof error === 'object' && 'code' in error && 'errno' in error) {
                    let err = <MysqlError>error;
                    console.log(`Ошибка запроса: ${err.sql}, номер ошибки: ${err.errno}, сообщение ошибки: ${err.sqlMessage}`);
                    return;
                }

                //* любая другая ошибка
                console.log('Сообщение ошибки:', error.message);
                return;
            }
        );

1) Второй пример

        new ModelCity().select('Name').where('ID', '=', 1).execute()
            .then( res => console.log(res))
            .catch( error => {
                
                //* ошибка MySQL
                if (typeof error === 'object' && 'code' in error && 'errno' in error) {
                    let err = <MysqlError>error;
                    console.log(`Ошибка запроса: ${err.sql}, номер ошибки: ${err.errno}, сообщение ошибки: ${err.sqlMessage}`);
                    return;
                }

                //* любая другая ошибка
                console.log('Сообщение ошибки:', error.message);
                return;
            });

***
# Примечание:
### Для каждого метода в исходных файлах применяется JSDoc, а так же имеются типы к ним в формате d.ts, так что если в вашем ide поддерживаются подсказки вы сможете увидеть сигнатуру метода и описание принимаемых им аргументов при наведении на него.