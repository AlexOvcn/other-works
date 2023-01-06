//? Библиотека для комфортной работы с запросами MySQL. V 1.0.0

//* импортируем интерфейсы: ошибки MySQL, пула, ответ бд при запросах отличных от select
import { Pool, OkPacket } from 'mysql';

//* определение типа доступных знаков сравнения 
type ComparisonSignsType = '='|'!='|'<>'|'<'|'>'|'<='|'>='|'LIKE';
//* определение типа доступных знаков арифметических операций 
type SignsArithmeticOperationsType = '+'|'-'|'/'|'*';
//* определение типа доступных методов соединений
type JoinMethodsType = 'INNER'|'LEFT'|'RIGHT';

//* описываем расширение модели к базе данных для работы с запросами к ней
export abstract class ModelExtension {

    /**
     * Определение обьекта с полями, нужными для определенных методов
     * @param open_pool_connections Открытый пул соединений для отправки запросов, обязательный параметр [Pool]
     * @param table Указание текущей таблицы, используется в большинстве методов [string]
     */
    protected abstract options: {
        // открытый пул соединений
        open_pool_connections: Pool
        // текущая таблица
        table?: string
    }

    /**
     * Свойство представляет из себя строку запроса, которая будет собираться по частям в процессе работы методов класса
     */
    private query: string;
    /**
     * Свойство представляет из себя массив значений, который будет пополняться в процессе работы методов класса
     */
    private values: (string | number)[];

    /**
     * Основная функция для непосредственного взаимодействия с базой данных
     * @param query Строка запроса
     * @param values Массив значений
     * @returns Возвращается промис в котором первым аргументом попадает либо результат ответа на запрос либо ошибка MysqlError
     */
    private executeQuery(query: string, values: (string | number)[]): Promise<OkPacket|any[]>

    /**
     * Метод для проверки некоторых ключевых строк перед вставкой в запрос
     * @param str Строка для проверки
     * @returns Возвращает проверяемую строку или null
     */
    private checkingSomeSymbols(str: string|null|undefined): string|null

    /**
     * Метод для создания неограниченного количества вопросительных знаков для вставки в предварительный запрос
     * @param quantity Количество вопросительных меток
     * @param sign Знак запятой, если нужно разделение между значениями
     * @param typeOfValue Тип значения для вставки (как поле или как значение)
     * @param modeWithBrackets Если нужно объединение в группы, к примеру для работы с INSERT INTO VALUES (Опционально) (По умолч. = false)
     * @param frequency Количество значений в одной группе (Опционально) (По умолч. = 1)
     * @returns Возвращается сконкатенированная строка из знаков вопроса разделенных запятой, кроме последнего знака
     */
    private creatorOfQuestionMarks(quantity: number, sign: boolean, typeOfValue: 'field'|'value', modeWithBrackets?: boolean, frequency?: number): string

    /**
     * Метод для создания неограниченного количества вопросительных знаков для вставки в предварительный запрос (специально для инструкции SET)
     * @param quantity Количество присваиваемых блоком
     * @param useCurrentValue Передается массив соразмерный количеству вводимых значений, в массиве указать знаки арифметических операций, если нужно произвести операцию с текущим значением поля(+ - * /), к примеру currentField = currentField + 1, или передать null любому из значений, если подразумевается обычное присваение currentField = someValue
     * @returns Возвращается сконкатенированная строка из присваиваний со знаками вопроса разделенных запятой, кроме последнего присваивания
     */
    private creatorOfQuestionMarksForSET(quantity: number, useCurrentValue: (SignsArithmeticOperationsType|null)[]): string

    /**
     * Метод для создания неограниченного количества вопросительных знаков для вставки в предварительный запрос (специально для мест где необходимо выбрать поле с уточнением таблицы)
     * @param fields Передается массив из строки(название таблицы) или массива с двумя строками(названием таблицы и названием столбца)
     * @returns Возвращается сконкатенированная строка из знаков вопроса разделенных запятой, кроме последнего знака
     */
    private creatorOfQuestionMarksForTableWithColumn(fields: (string|[string,string])[]): string

    /**
     * Метод для завершения построения запроса и отправки его в базу данных
     * @type `ResType` Если известен тип ожидаемого ответа, можем его указать
     * @param showDetails Позволяет показать детали запроса сконструированного этим классом (опционально) (по умолчанию = false)
     * @returns Возвращается промис в котором первым аргументом попадает либо результат ответа на запрос либо ошибка
     */
    execute<ResType = any>(showDetails?: boolean): Promise<OkPacket|ResType[]>

    /**
     * Метод для сортировки по значени(ю/ям) в указанн(ом/ых) пол(е/ях)
     * @param field Поле сортируемого значения
     * @param sign Знак сравнения
     * @param value Сравниваемое значение
     * @param additionalCondition Добавление еще одного блока сравнения с разделителем OR, AND (Опционально)
     * @param field2 Поле сортируемого значения (Опционально)
     * @param sign2 Знак сравнения (Опционально)
     * @param value2 Сравниваемое значение (Опционально)
     * @param additionalCondition2 Добавление еще одного блока сравнения с разделителем OR, AND (Опционально)
     * @param field3 Поле сортируемого значения (Опционально)
     * @param sign3 Знак сравнения (Опционально)
     * @param value3 Сравниваемое значение (Опционально)
     * @returns Возвращает контекст текущего класса
     */
    where(field: string, sign: ComparisonSignsType, value: string|number): this
    where(field: string, sign: ComparisonSignsType, value: string|number, additionalCondition: 'AND'|'OR', field2: string, sign2: ComparisonSignsType, value2: string|number): this
    where(field: string, sign: ComparisonSignsType, value: string|number, additionalCondition: 'AND'|'OR', field2: string, sign2: ComparisonSignsType, value2: string|number, additionalCondition2: 'AND'|'OR', field3: string, sign3: ComparisonSignsType, value3: string|number): this

    /**
     * Метод для группировки значений в столбцах
     * @note Использование агрегатных функций не реализовано, обратитесь к методу ownQuery
     * @param fields Поля, которые будут группироваться
     * @returns Возвращает контекст текущего класса
     */
    groupBy(...fields: string[]): this

    /**
     * Метод для выстраивания значений таблицы в определенном порядке
     * @param fields Поля по которым будет определятся порядок
     * @param method Метод выстраивания значений (Опционально) (по умолчанию = 'ASC')
     * @returns Возвращает контекст текущего класса
     */
    orderBy(fields: string[], method?: 'ASC'|'DESC'|'RANDOM'): this

    /**
     * Метод для лимитирования результата выборки
     * @param quantityOfReturnRows Количество возвращаемых строк - лимит
     * @param quantityOfRowsToSkip Количество пропускаемых строк перед началом возвращаемых (Опционально) (по умолчанию = 0)
     * @returns Возвращает контекст текущего класса
     */
    limit(quantityOfReturnRows: number, quantityOfRowsToSkip?: number): this

    /**
     * Метод для выбора возвращаемых полей в результирующей выборке
     * @note Использование агрегатных функций не реализовано, обратитесь к методу ownQuery
     * @param fields Возвращаемые поля, если нужно уточнить в какой таблице поле находится, то можно передать массив из двух строк(названия таблицы и названия столбца), иначе указать только название столбца
     * @returns Возвращает контекст текущего класса
     */
    select(...fields: (string|[string,string])[]): this

    /**
     * Метод для выборки данных из нескольких таблиц, результат складывается в результирующий набор
     * @note При указании сравниваемого поля можно указать название поля или же можно передать массив с двумя строками - названием таблицы и поля соответственно
     * @param method Метод работы JOIN
     * @param tables Присоединяемые таблицы
     * @param firstField Сравниваемое поле
     * @param sign Знак сравнения
     * @param secondField Сравниваемое поле
     * @param additionalCondition Добавление еще одного блока сравнения с разделителем OR, AND (Опционально)
     * @param firstField2 Сравниваемое поле (Опционально)
     * @param sign2 Знак сравнения (Опционально)
     * @param secondField2 Сравниваемое поле (Опционально)
     * @param additionalCondition2 Добавление еще одного блока сравнения с разделителем OR, AND (Опционально)
     * @param firstField3 Сравниваемое поле (Опционально)
     * @param sign3 Знак сравнения (Опционально)
     * @param secondField3 Сравниваемое поле (Опционально)
     * @returns Возвращает контекст текущего класса
     */
    join(method: JoinMethodsType, tables: string[], firstField: string|[string, string], sign: ComparisonSignsType, secondField: string|[string, string]): this
    join(method: JoinMethodsType, tables: string[], firstField: string|[string, string], sign: ComparisonSignsType, secondField: string|[string, string], additionalCondition: 'AND'|'OR', firstField2: string|[string, string], sign2: ComparisonSignsType, secondField2: string|[string, string]): this
    join(method: JoinMethodsType, tables: string[], firstField: string|[string, string], sign: ComparisonSignsType, secondField: string|[string, string], additionalCondition: 'AND'|'OR', firstField2: string|[string, string], sign2: ComparisonSignsType, secondField2: string|[string, string], additionalCondition2: 'AND'|'OR', firstField3: string|[string, string], sign3: ComparisonSignsType, secondField3: string|[string, string]): this

    /**
     * Метод для вставки данных в бд
     * @param fields Поля в которые будут вставляться значения
     * @param values Вставляемые значения (запись имеет следующий вид, в массив записываются массивы, один массив - это одна затрагиваемая строка в бд)
     * @returns Возвращает контекст текущего класса
     */
    insertValues(fields: string[], values: (string|number)[][]): this

    /**
     * Метод для 'частичного' обновления данных в таблице бд (если обновляемая строка не найдена - новая не создается)
     * @note Многотабличное обновление не реализовано, обратитесь к методу ownQuery
     * @param fields Поля в которых будут обновляться значения
     * @param values Вставляемые значения
     * @param useCurrentValue Передается массив соразмерный количеству обновляемых значений, в массиве указать знаки арифметических операций, если нужно произвести операцию с текущим значением поля(+ - * /), к примеру currentField = currentField + 1, или передать null любому из значений, если подразумевается обычное присваение currentField = someValue
     * @returns Возвращает контекст текущего класса
     */
    updateSet(fields: string[], values: (string|number)[], useCurrentValue: (SignsArithmeticOperationsType|null)[]): this

    /**
     * Метод для полного обновления данных в таблице бд, если какое-то поле не указали при выборе изменяемых полей, то значение в этих полях сбросится к значению по умолчанию либо появится ошибка при ограниченях в бд для определенных полей (если обновляемая строка не найдена - создается новая)
     * @param fields Поля которые учавствуют в обновлении или вставке
     * @param values Обновляемые или вставляемые значения (запись имеет следующий вид, в массив записываются массивы, один массив - это одна затрагиваемая строка в бд)
     * @returns Возвращает контекст текущего класса
     */
    replaceValues(fields: string[], values: (string|number)[][]): this

    /**
     * Метод для удаления данных
     * @attention Работает в таблице, которая была указана в модели
     * @returns Возвращает контекст текущего класса
     */
    delete(): this

    /**
     * Метод для создания любого запроса MySQL (так же он может просто дополнить запрос)
     * @param query Строка запроса, в которой нужно проставить метки для последующих вставок значений (?? - поле, ? - значение)
     * @param values Значения, которые по очереди будут вставляться в строку запроса
     * @returns Возвращает контекст текущего класса
     */
    ownQuery(query: string, values: (string|number)[]): this
}