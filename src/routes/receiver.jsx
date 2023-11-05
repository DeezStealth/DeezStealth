import { useEffect, useState, Fragment } from 'react'
import { ethers } from 'ethers'
import { Title } from './helper/DocumentTitle'
import styles from './Sender.module.scss'
import { getStealthPrivateKey } from '../util/stealth'
import abi from '../abi/DeezStealth'

const contractAddress = '0x04eAC8cd77aE31c4Eb22C6Eb6cECac0A58e544fB' // TODO extract from here

export default function Receiver({ title }) {
  Title(title)

  const [contract, setContract] = useState(null)
  const [isReady, setIsReady] = useState(false)

  const [isRemoving, setIsRemoving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [publicKeyInput, setPublicKeyInput] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [sharedSecret, setSharedSecret] = useState('')

  useEffect(() => {
    const provider = new ethers.BrowserProvider(window.ethereum)
    provider.getSigner().then(signer => {
      const contract = new ethers.Contract(contractAddress, abi, signer)

      setContract(contract)

      // TODO
      contract.pubKey(signer.address).then(pubKey => {
        if (pubKey.length > 2) {
          setPublicKey(pubKey)
        }
        setIsReady(true)
      })
    })
  }, [])

  const handleGenerate = async () => {
    // TODO validation
    if (privateKey.length === 0 || sharedSecret.length === 0) {
      alert('Invalid inputs')
    }
    alert(getStealthPrivateKey(privateKey, sharedSecret))
  }

  const handleSubmitPubKey = async () => {
    let _pubKey = publicKeyInput
    if (publicKeyInput.substring(0, 2) !== '0x') {
      _pubKey = '0x' + publicKeyInput
    }
    // TODO try to add 0x prefix?
    if (ethers.isHexString(_pubKey, 32)) { // is valid private key?
      const wallet = new ethers.Wallet(_pubKey)
      _pubKey = wallet.signingKey.publicKey
      console.log('PUBLIC KEY', _pubKey)
    } else {
      if (!ethers.isHexString(_pubKey, 64)) { // is valid public key?
        alert('Value you have provided is not a valid public or private key')
        return
      }
    }
    setIsSubmitting(true)
    const tx = await contract.setPubKey(_pubKey)
    await tx.wait()
    // TODO check if no errors
    setPublicKey(_pubKey)
    setIsSubmitting(false)
  }

  const handleRemovePubKey = async () => {
    setIsRemoving(true)
    const tx = await contract.removePubKey()
    await tx.wait()
    // TODO check if no errors
    setPublicKey('')
    setIsRemoving(true)
  }

  return (
    <section className={styles.section}>
      <div className={`__container ms-motion-slideUpIn`} data-width={`large`}>
        <div className={`card ms-depth-4 text-justify`}>
          <div className='card__body'>
            {!isReady ? (
              <Fragment>
                <h3>Public Key</h3>
                Loading...
              </Fragment>
            ) : (
              <Fragment>
                {publicKey === '' ? (
                  <Fragment>
                    <h3>Save Public Key</h3>
                    <p><input type="text" placeholder="Public Key or Private Key" value={publicKeyInput} onChange={e => setPublicKeyInput(e.target.value)} /></p>
                    <p><button onClick={handleSubmitPubKey} disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit'}</button></p>
                    <p>&nbsp;</p>
                  </Fragment>
                ) : (
                  <Fragment>
                    <h3>Public Key</h3>
                    <p>{publicKey} [copy]</p>
                    <p><button onClick={handleRemovePubKey} disabled={isRemoving}>{isRemoving ? 'Removing...' : 'Remove'}</button></p>
                  </Fragment>
                )}
              </Fragment>
            )}

            <p>&nbsp;</p>
            <h3>Generate Stealth Private Key</h3>
            <p><input type="text" placeholder="Shared Secret" value={sharedSecret} onChange={e => setSharedSecret(e.target.value)} /></p>
            <p><input type="password" placeholder="Private Key" value={privateKey} onChange={e => setPrivateKey(e.target.value)} /></p>
            <p><button onClick={handleGenerate}>Generate</button></p>
          </div>
        </div>
      </div>
    </section>
  )
}
