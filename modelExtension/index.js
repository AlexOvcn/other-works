//? Библиотека для комфортной работы с запросами MySQL. V 1.0.0

exports.ModelExtension = class ModelExtension {

    options = {}

    #query = '';
    #values = [];

    async #executeQuery(query, values) {

        //* создание асинхронного выполнения запроса
        let result = await (new Promise((resolve, reject) => {

            if (!this.options.open_pool_connections) {return reject(new Error('Не назначено свойство "open_pool_connections" в обьекте options! А оно является обязательным.'))}

            //* получение свободного соединения из пула 
            this.options.open_pool_connections.getConnection(function(err, connection) {
                if (err) return reject(err); //* нет соединения

                //* использование соединения
                connection.query(query, values, function (error, results) {

                    //* когда запрос выполнен, нужно отпустить подключение обратно в пул
                    connection.release();
                    //* если произошла ошибка в запросе, обрабатываем после релиза
                    if (error) return reject(error);
                    //* возвращаем результат с разрешившимся промисом
                    resolve(results);
                
                    //* здесь соединение уже недоступно, так как оно было возвращено в пул
                });

            });

        }));
        return result;
    }

    #checkingSomeSymbols(str) {
        switch (str) {
            case '=': return str;
            case '!=': return str;
            case '<>': return str;
            case '<': return str;
            case '>': return str;
            case '<=': return str;
            case '>=': return str;
            case 'AND': return str;
            case 'OR': return str;
            case 'LIKE': return str;
            case '+': return str;
            case '-': return str;
            case '*': return str;
            case '/': return str;
            case 'ASC': return str;
            case 'DESC': return str;
            case 'RANDOM': return 'rand()';
            case 'INNER': return str;
            case 'LEFT': return str;
            case 'RIGHT': return str;
            default: return null;
        }
    }

    #creatorOfQuestionMarks(quantity, sign, typeOfValue, modeWithBrackets = false, frequency = 1) {
        let str = '';
        const typeOfDesignation = { "field": '??', "value": '?' };
        for (let i = 0; i < quantity; i++) {
            if (modeWithBrackets && i === 0) str += '(';
            i+1 === quantity ? str += typeOfDesignation[typeOfValue] : str += `${typeOfDesignation[typeOfValue]}${modeWithBrackets && (i+1) % frequency === 0 ? ')' : ''}${sign ? ',': ''} ${modeWithBrackets && (i+1) % frequency === 0 ? '(' : ''}`;
            if (modeWithBrackets && i+1 === quantity) str += ')';
        }
        return str;
    }

    #creatorOfQuestionMarksForSET(quantity, useCurrentValue) {
        let str = '';
        for (let i = 0; i < quantity; i++) {
            let sign = this.#checkingSomeSymbols(useCurrentValue[i]);
            let subStr = sign ? '?? ' + sign + ' ?' : '?';
            i+1 === quantity ? str += `?? = ${subStr}` : str += `?? = ${subStr}, `;
        }
        return str;
    }

    #creatorOfQuestionMarksForTableWithColumn(fields) {
        let str = '';
        for (let i = 0; i < fields.length; i++) {
            str += Array.isArray(fields[i]) ? `??.??${i+1 === fields.length ? '' : ', '}` : `??${i+1 === fields.length ? '' : ', '}`;
        }
        return str;
    }

    async execute(showDetails = false) {
        let res = await this.#executeQuery(this.#query, this.#values);
        if (showDetails) {
            console.log('\r\nОпределения для подстановки: ?? - поле, ? - значение \r\n', 'Массив собранных значений: ', this.#values, '\r\n Строка запроса с метками для подстановки: ', this.#query, '\r\n');
        }
        return res;
    }

    where(field, sign, value, additionalCondition, field2, sign2, value2, additionalCondition2, field3, sign3, value3) {
        this.#values = this.#values.concat([...[field, value, field2, value2, field3, value3].filter((el) => el !== undefined)]);
        this.#query += `WHERE ?? ${this.#checkingSomeSymbols(sign)} ? ${this.#checkingSomeSymbols(additionalCondition) ? `${additionalCondition} ${field2 !== undefined ? '??' : 'null'} ${this.#checkingSomeSymbols(sign2)} ${value2 !== undefined ? '?' : 'null'} ${this.#checkingSomeSymbols(additionalCondition2) ? `${additionalCondition2} ${field3 !== undefined ? '??' : 'null'} ${this.#checkingSomeSymbols(sign3)} ${value3 !== undefined ? '?' : 'null'} ` : ''}`: ''}`;
        return this;
    }

    groupBy(...fields) {
        this.#query += `GROUP BY ${this.#creatorOfQuestionMarks(fields.length, true, 'field')} `;
        this.#values = this.#values.concat(...fields);
        return this;
    }

    orderBy(fields, method = 'ASC') {
        this.#query += `ORDER BY${method === 'RANDOM' ? '' : ` ${this.#creatorOfQuestionMarks(fields.length, true, 'field')}`} ${this.#checkingSomeSymbols(method)} `;
        if (method !== 'RANDOM') this.#values = this.#values.concat(...fields);
        return this;
    }

    limit(quantityOfReturnRows, quantityOfRowsToSkip = 0) {
        this.#values = this.#values.concat(quantityOfReturnRows, quantityOfRowsToSkip);
        this.#query += `LIMIT ? OFFSET ? `;
        return this;
    }

    select(...fields) {
        let finallyFieldsArray = [];
        fields.map(el => Array.isArray(el) ? finallyFieldsArray = finallyFieldsArray.concat(el) : finallyFieldsArray.push(el));
        this.#query += `SELECT ${finallyFieldsArray[0] === '*' ? '*' : this.#creatorOfQuestionMarksForTableWithColumn(fields)} FROM \`${this.options.table}\` `;
        if (fields[0] !== '*') this.#values = this.#values.concat(finallyFieldsArray);
        return this;
    }

    join(method, tables, firstField, sign, secondField, additionalCondition, firstField2, sign2, secondField2, additionalCondition2, firstField3, sign3, secondField3) {
        let filteredFieldsArray = [firstField, secondField, firstField2, secondField2, firstField3, secondField3].filter((el) => el !== undefined);
        let finallyFieldsArray = [];
        filteredFieldsArray.map(el => Array.isArray(el) ? finallyFieldsArray = finallyFieldsArray.concat(el) : finallyFieldsArray.push(el));
        this.#values = this.#values.concat([...tables , ...finallyFieldsArray]);
        this.#query += `${this.#checkingSomeSymbols(method)} JOIN ${this.#creatorOfQuestionMarks(tables.length, true, 'field')} ON ${Array.isArray(firstField) ? `??.??` : '??'} ${this.#checkingSomeSymbols(sign)} ${Array.isArray(secondField) ? `??.??` : '??'} ${this.#checkingSomeSymbols(additionalCondition) ? `${additionalCondition} ${firstField2 !== undefined ? Array.isArray(firstField2) ? `??.??` : '??' : 'null'} ${this.#checkingSomeSymbols(sign2)} ${secondField2 !== undefined ? Array.isArray(secondField2) ? `??.??` : '??' : 'null'} ${this.#checkingSomeSymbols(additionalCondition2) ? `${additionalCondition2} ${firstField3 !== undefined ? Array.isArray(firstField3) ? `??.??` : '??' : 'null'} ${this.#checkingSomeSymbols(sign3)} ${secondField3 !== undefined ? Array.isArray(secondField3) ? `??.??` : '??' : 'null'} ` : ''}`: ''}`;
        return this;
    }

    insertValues(fields, values) {
        let finallyValuesArray = [];
        values.map(el => finallyValuesArray = finallyValuesArray.concat(el));
        this.#values = this.#values.concat([...fields, ...finallyValuesArray]);
        this.#query += `INSERT INTO ${this.options.table} ${this.#creatorOfQuestionMarks(fields.length, true, 'field', true, fields.length)} VALUES ${this.#creatorOfQuestionMarks(finallyValuesArray.length, true, 'value', true, fields.length)} `;
        return this;
    }

    updateSet(fields, values, useCurrentValue) {
        for (let i = 0; i < fields.length; i++) {
            if (this.#checkingSomeSymbols(useCurrentValue[i])) {
                this.#values = this.#values.concat([fields[i], fields[i], values[i]]);
            } else {
                this.#values = this.#values.concat([fields[i], values[i]]);
            }
        }
        this.#query += `UPDATE ${this.options.table} SET ${this.#creatorOfQuestionMarksForSET(fields.length, useCurrentValue)} `;
        return this;
    }

    replaceValues(fields, values) {
        let finallyValuesArray = [];
        values.map(el => finallyValuesArray = finallyValuesArray.concat(el));
        this.#values = this.#values.concat([...fields, ...finallyValuesArray]);
        this.#query += `REPLACE INTO ${this.options.table} ${this.#creatorOfQuestionMarks(fields.length, true, 'field', true, fields.length)} VALUES ${this.#creatorOfQuestionMarks(finallyValuesArray.length, true, 'value', true, fields.length)} `;
        return this;
    }

    delete() {
        this.#query += `DELETE FROM ${this.options.table} `;
        return this
    }

    ownQuery(query, values) {
        this.#query += query;
        this.#values = this.#values.concat(values);
        return this;
    }
}
