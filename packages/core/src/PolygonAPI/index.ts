import ApiWrapper from '../DecentrawebAPI/ApiWrapper';
import {
  RequestTLDRegistrationPayload,
  RequestTLDRegistrationResponse,
  SendCommitmentPayload,
  SendCommitmentResponse,
  SubmitTLDRegistrationPayload,
  SubmitTLDRegistrationResponse
} from './types';

class PolygonApi extends ApiWrapper {
  sendTLDCommitment(payload: SendCommitmentPayload): Promise<SendCommitmentResponse> {
    return this.post<SendCommitmentResponse>('/api/v1/send-commitment-tx', {}, {
      ...payload,
      chainid: this.chainId
    });
  }

  requestTLDRegistration(
    payload: RequestTLDRegistrationPayload
  ): Promise<RequestTLDRegistrationResponse> {
    return this.post<RequestTLDRegistrationResponse>('/api/v1/get-registration-tx', {}, {
      ...payload,
      chainid: this.chainId
    });
  }

  submitTLDRegistration(
    payload: SubmitTLDRegistrationPayload
  ): Promise<SubmitTLDRegistrationResponse> {
    return this.post<SubmitTLDRegistrationResponse>('/api/v1/send-registration-tx', {}, {
      ...payload,
      chainid: this.chainId
    });
  }
}

export default PolygonApi;
