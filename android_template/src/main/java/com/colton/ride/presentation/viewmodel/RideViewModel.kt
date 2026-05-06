package com.colton.ride.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.colton.ride.domain.model.Ride
import com.colton.ride.domain.repository.RideRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class RideViewModel @Inject constructor(
    private val repository: RideRepository
) : ViewModel() {

    private val _rideState = MutableStateFlow<RideState>(RideState.Idle)
    val rideState: StateFlow<RideState> = _rideState

    fun requestRide(pickup: String, dropoff: String) {
        viewModelScope.launch {
            _rideState.value = RideState.Loading
            try {
                val ride = repository.requestRide(pickup, dropoff)
                _rideState.value = RideState.Success(ride)
            } catch (e: Exception) {
                _rideState.value = RideState.Error(e.message ?: "Unknown error")
            }
        }
    }
}

sealed class RideState {
    object Idle : RideState()
    object Loading : RideState()
    data class Success(val ride: Ride) : RideState()
    data class Error(val message: String) : RideState()
}
