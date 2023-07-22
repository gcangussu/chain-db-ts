import axios from 'axios'
import { ChainDB } from './chain-db'
import { CONTRACT_PAYLOAD, CONTRACT_TRANSACTION } from './constants'
import { ContractTransactionData, TransactionType } from './types'
import { post } from './utils'

class Table<Model> {
  public table: Model
  private contract_id = ''
  private db: ChainDB

  constructor(table: Model, contract_id: string, db: ChainDB) {
    this.table = table
    this.contract_id = contract_id
    this.db = db
  }

  /**
   * Persist table data on chain
   */
  async persist() {
    const url = `${this.db.api}${CONTRACT_TRANSACTION}`
    const contract_data = JSON.stringify(this.table)

    const body = {
      tx_type: TransactionType.CONTRACT,
      contract_id: this.contract_id,
      db_access_key: this.db.access_key,
      data: contract_data,
    }

    try {
      await post(url, body)
    } catch {
      throw new Error('Something went wrong!')
    }
  }
}

export const get = async <Model>(db: ChainDB, table_name: string, model: Model) => {
  const contract_id = db.access!.parse(db.name, table_name)

  // URL - Load table content from chain
  const url = `${db.api}${CONTRACT_PAYLOAD}/${contract_id}/${db.access_key}`

  try {
    const contract_response = await axios.get(url)
    const contract_data_json: ContractTransactionData<Model> = contract_response.data

    // If there's already a table (contract) with data, then, fetch its data
    if (contract_data_json.tx_type === TransactionType.CONTRACT) {
      const table = new Table<Model>(contract_data_json.data, contract_id, db)
      return table
    }

    // If there's no content for this table (contract), then, create a new table
    const table = new Table<Model>(model, contract_id, db)
    return table
  } catch {
    throw new Error('Something went wrong!')
  }
}
